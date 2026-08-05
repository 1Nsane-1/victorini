import React, { useState, useEffect } from "react";
import { generateTestHTML } from "../testTemplate";
import {
  Plus,
  Trash2,
  Download,
  CloudUpload,
  Copy,
  Check,
  FolderPlus,
} from "lucide-react";

const letterFor = (i) => String.fromCharCode(65 + i);

export default function Constructor() {
  const [settings, setSettings] = useState({
    title: "Новый тест",
    pointsPerQuestion: 1,
    passScore: 50,
    passMode: "absolute",
  });
  const [questions, setQuestions] = useState([]);

  const [savedQuizId, setSavedQuizId] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  // --- ВОТ ОТСЮДА НАЧИНАЕТСЯ НОВАЯ ЛОГИКА ПАПОК ---

  // --- ЛОГИКА ПАПОК (ТОЛЬКО ЧТЕНИЕ) ---
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("");

  // Загружаем актуальные папки с сервера (созданные через Анализатор)
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const API_URL =
          import.meta.env.VITE_API_URL || "https://victorini-api.onrender.com";
        const res = await fetch(`${API_URL}/api/folders`);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setFolders(data);
          setSelectedFolder(data[0]); // По умолчанию выбираем первую папку (например, "1")
        } else {
          // Если вообще ничего нет, ставим 1 как fallback
          setFolders(["1"]);
          setSelectedFolder("1");
        }
      } catch (err) {
        console.error("Ошибка загрузки папок:", err);
      }
    };
    fetchFolders();
  }, []);
  // --- КОНЕЦ ЛОГИКИ ПАПОК ---

  // Ниже идет твой старый код: handleCopyLink, addQuestion, updateQuestion и так далее...
  const handleCopyLink = () => {
    if (!savedQuizId) return;
    const link = `https://victorini.vercel.app/quiz/${savedQuizId}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: "", type: "radio", options: [""], correctAnswers: [] },
    ]);
  };

  const updateQuestion = (index, field, value) => {
    const newQ = [...questions];
    newQ[index][field] = value;
    setQuestions(newQ);
  };

  const addOption = (qIndex) => {
    const newQ = [...questions];
    newQ[qIndex].options.push("");
    setQuestions(newQ);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const newQ = [...questions];
    newQ[qIndex].options[oIndex] = value;
    setQuestions(newQ);
  };

  const removeOption = (qIndex, oIndex) => {
    const newQ = [...questions];
    newQ[qIndex].options.splice(oIndex, 1);
    newQ[qIndex].correctAnswers = newQ[qIndex].correctAnswers.filter(
      (ans) => ans !== oIndex,
    );
    setQuestions(newQ);
  };

  const toggleCorrectAnswer = (qIndex, oIndex) => {
    const newQ = [...questions];
    const q = newQ[qIndex];
    if (q.type === "radio") {
      q.correctAnswers = [oIndex];
    } else {
      if (q.correctAnswers.includes(oIndex)) {
        q.correctAnswers = q.correctAnswers.filter((ans) => ans !== oIndex);
      } else {
        q.correctAnswers.push(oIndex);
      }
    }
    setQuestions(newQ);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleGenerate = () => {
    if (questions.length === 0) return alert("Добавьте хотя бы один вопрос");

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text)
        return alert(`Вопрос ${i + 1} не содержит текста`);
      if (questions[i].correctAnswers.length === 0)
        return alert(`Вопрос ${i + 1} не имеет правильного ответа`);
    }

    const quizData = { ...settings, questions };
    const htmlContent = generateTestHTML(quizData);

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "test.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- ОБНОВЛЕННАЯ ФУНКЦИЯ СОХРАНЕНИЯ В БД ---
  const saveSurveyToServer = async () => {
    if (questions.length === 0) return alert("Добавьте хотя бы один вопрос");

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text)
        return alert(`Вопрос ${i + 1} не содержит текста`);
      if (questions[i].correctAnswers.length === 0)
        return alert(`Вопрос ${i + 1} не имеет правильного ответа`);
    }

    const blocks = questions.map((q) => ({
      type: "question",
      content: q,
    }));

    // Добавляем информацию о папке в объект для бэкенда
    const surveyData = {
      title: settings.title,
      description: JSON.stringify({ ...settings, folder: selectedFolder }),
      blocks: blocks,
      folder: selectedFolder,
    };

    const API_URL =
      import.meta.env.VITE_API_URL || "https://victorini-api.onrender.com";

    try {
      const response = await fetch(`${API_URL}/api/surveys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(surveyData),
      });

      const data = await response.json();

      if (response.ok) {
        // Сохраняем ID, чтобы показать кликабельную ссылку на экране
        setSavedQuizId(data._id);
      } else {
        alert("Ошибка при сохранении: " + (data.error || "Неизвестная ошибка"));
      }
    } catch (error) {
      console.error(error);
      alert("Ошибка соединения с сервером. Проверь ссылку на Render.");
    }
  };

  const totalPossible =
    questions.length * (Number(settings.pointsPerQuestion) || 0);

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Бланк теста</h2>
          <span className="text-muted">
            {questions.length} вопросов · до {totalPossible} баллов
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">Название теста</label>
          <input
            type="text"
            value={settings.title}
            onChange={(e) =>
              setSettings({ ...settings, title: e.target.value })
            }
            className="input-field title-input"
          />
        </div>

        {/* БЛОК ВЫБОРА ПАПКИ (ТОЛЬКО ЧТЕНИЕ ИЗ АНАЛИЗАТОРА) */}
        <div
          className="form-group"
          style={{
            background: "#f8fafc",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <label
            className="form-label"
            style={{ fontWeight: "600", display: "block", marginBottom: "8px" }}
          >
            📁 Папка для ответов учеников (из Анализатора)
          </label>

          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="input-field"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            {folders.map((f, i) => (
              <option key={i} value={f}>
                {f}
              </option>
            ))}
          </select>

          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "8px",
              fontStyle: "italic",
              marginBottom: 0,
            }}
          >
            * Создавать и удалять папки можно только на вкладке «Анализатор»
          </p>
        </div>

        <div className="grid-2">
          <div className="form-group mb-0">
            <label className="form-label">Баллов за вопрос</label>
            <input
              type="number"
              value={settings.pointsPerQuestion}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  pointsPerQuestion: Number(e.target.value),
                })
              }
              className="input-field"
            />
          </div>
          <div className="form-group mb-0">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <label className="form-label" style={{ marginBottom: 0 }}>
                Проходной порог
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  background: "#f3f4f6",
                  padding: "2px",
                  borderRadius: "6px",
                }}
              >
                <button
                  onClick={() =>
                    setSettings({ ...settings, passMode: "absolute" })
                  }
                  style={{
                    padding: "2px 8px",
                    fontSize: "12px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    background:
                      settings.passMode === "absolute"
                        ? "white"
                        : "transparent",
                    boxShadow:
                      settings.passMode === "absolute"
                        ? "0 1px 3px rgba(0,0,0,0.1)"
                        : "none",
                    fontWeight:
                      settings.passMode === "absolute" ? "600" : "400",
                    color: "var(--text-main)",
                  }}
                >
                  В баллах
                </button>
                <button
                  onClick={() =>
                    setSettings({ ...settings, passMode: "percentage" })
                  }
                  style={{
                    padding: "2px 8px",
                    fontSize: "12px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    background:
                      settings.passMode === "percentage"
                        ? "white"
                        : "transparent",
                    boxShadow:
                      settings.passMode === "percentage"
                        ? "0 1px 3px rgba(0,0,0,0.1)"
                        : "none",
                    fontWeight:
                      settings.passMode === "percentage" ? "600" : "400",
                    color: "var(--text-main)",
                  }}
                >
                  В процентах
                </button>
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <input
                type="number"
                value={settings.passScore}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    passScore: Number(e.target.value),
                  })
                }
                className="input-field"
                style={{
                  paddingRight: "30px",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "10px",
                  color: "var(--text-muted)",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                {settings.passMode === "percentage" ? "%" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {questions.map((q, qIndex) => (
        <div key={qIndex} className="card">
          <div className="question-row">
            <div className="q-number">{qIndex + 1}</div>
            <div className="q-content">
              <div className="q-header">
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) =>
                    updateQuestion(qIndex, "text", e.target.value)
                  }
                  placeholder="Текст вопроса..."
                  className="input-field"
                />
                <select
                  value={q.type}
                  onChange={(e) => {
                    updateQuestion(qIndex, "type", e.target.value);
                    updateQuestion(qIndex, "correctAnswers", []);
                  }}
                  className="input-field"
                  style={{ width: "220px" }}
                >
                  <option value="radio">Один правильный</option>
                  <option value="checkbox">Несколько правильных</option>
                </select>
                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="btn-icon"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div>
                {q.options.map((opt, oIndex) => {
                  const marked = q.correctAnswers.includes(oIndex);
                  return (
                    <div key={oIndex} className="option-row">
                      <button
                        type="button"
                        onClick={() => toggleCorrectAnswer(qIndex, oIndex)}
                        className={`bubble ${q.type === "checkbox" ? "checkbox" : ""} ${marked ? "active" : ""}`}
                      >
                        {letterFor(oIndex)}
                      </button>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) =>
                          updateOption(qIndex, oIndex, e.target.value)
                        }
                        placeholder={`Вариант ${letterFor(oIndex)}`}
                        className="input-field"
                      />
                      <button
                        onClick={() => removeOption(qIndex, oIndex)}
                        className="btn-icon"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => addOption(qIndex)}
                  className="add-option-btn"
                >
                  <Plus size={16} /> Добавить вариант
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {questions.length === 0 && (
        <div
          className="card"
          style={{
            padding: "60px 20px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          Пока нет ни одного вопроса — начните с кнопки ниже
        </div>
      )}

      <div className="actions-row">
        <button onClick={addQuestion} className="btn btn-outline">
          <Plus size={18} /> Добавить вопрос
        </button>
        <button
          onClick={saveSurveyToServer}
          className="btn btn-primary"
          style={{ background: "#10b981", borderColor: "#10b981" }}
        >
          <CloudUpload size={18} /> В базу данных
        </button>
        <button onClick={handleGenerate} className="btn btn-primary">
          <Download size={18} /> Сгенерировать test.html
        </button>
      </div>

      {/* КАРТОЧКА С ГОТОВОЙ ССЫЛКОЙ ДЛЯ ШЕРИНГА */}
      {savedQuizId && (
        <div
          className="card"
          style={{
            marginTop: "24px",
            background: "#ecfdf5",
            borderColor: "#10b981",
            borderWidth: "2px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "20px" }}>🎉</span>
            <h3 style={{ margin: 0, color: "#065f46" }}>
              Тест успешно сохранен!
            </h3>
          </div>
          <p
            style={{ margin: "0 0 12px 0", color: "#047857", fontSize: "14px" }}
          >
            Ответы учеников будут сохраняться в папку:{" "}
            <strong>«{selectedFolder}»</strong>
          </p>

          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              readOnly
              value={`https://victorini.vercel.app/quiz/${savedQuizId}`}
              className="input-field"
              style={{
                background: "white",
                fontWeight: "600",
                color: "#0f766e",
              }}
            />
            <button
              onClick={handleCopyLink}
              className="btn btn-primary"
              style={{
                background: isCopied ? "#059669" : "#10b981",
                borderColor: "#10b981",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {isCopied ? <Check size={18} /> : <Copy size={18} />}
              {isCopied ? "Скопировано!" : "Скопировать ссылку"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
