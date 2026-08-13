import React, { useState } from "react";
import { generateTestHTML } from "../testTemplate";
import {
  Plus,
  Trash2,
  Download,
  CloudUpload,
  Copy,
  Check,
  ImagePlus,
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

  // Ключ для загрузки картинок на ImgBB
  const IMGBB_API_KEY = "8deb2e334c5cdd899dc40c4e49f1d866";

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
      {
        text: "",
        type: "radio",
        options: [""],
        correctAnswers: [],
        imageUrl: "",
        imageLayout: "top",
      },
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

  // --- Функция загрузки картинки ---
  const handleImageUpload = async (qIndex, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Включаем "режим загрузки" визуально
    const inputElement = event.target;
    const parentLabel = inputElement.parentElement;
    const originalText = parentLabel.innerText;
    parentLabel.innerText = "Загрузка...";

    const formData = new FormData();
    formData.append("image", file);
    formData.append("key", IMGBB_API_KEY);

    try {
      const response = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        updateQuestion(qIndex, "imageUrl", data.data.url);
        if (!questions[qIndex].imageLayout) {
          updateQuestion(qIndex, "imageLayout", "top");
        }
      } else {
        alert("Ошибка загрузки изображения на сервер");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети при загрузке изображения");
    } finally {
      // Возвращаем текст обратно (хотя лейбл и так исчезнет при успешной загрузке)
      if (parentLabel)
        parentLabel.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg> Добавить фото`;
    }
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

  // --- СОХРАНЕНИЕ В БАЗУ ДАННЫХ ---
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
      content: q, // Тут теперь автоматически улетят и imageUrl, и imageLayout!
    }));

    const surveyData = {
      title: settings.title,
      description: JSON.stringify(settings),
      blocks: blocks,
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
              <div className="q-header" style={{ marginBottom: "12px" }}>
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

              {/* НОВЫЙ БЛОК: ЗАГРУЗКА И НАСТРОЙКА КАРТИНКИ */}
              <div style={{ marginBottom: "16px" }}>
                {!q.imageUrl ? (
                  <label
                    className="btn btn-outline"
                    style={{
                      cursor: "pointer",
                      padding: "8px 12px",
                      fontSize: "14px",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <ImagePlus size={16} style={{ marginRight: "6px" }} />
                    Добавить фото
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleImageUpload(qIndex, e)}
                    />
                  </label>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      background: "#f8fafc",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <img
                      src={q.imageUrl}
                      alt="Превью"
                      style={{
                        height: "40px",
                        width: "auto",
                        borderRadius: "4px",
                        border: "1px solid #cbd5e1",
                      }}
                    />

                    <div style={{ flex: 1 }}>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Расположение фото
                      </span>
                      <select
                        value={q.imageLayout || "top"}
                        onChange={(e) =>
                          updateQuestion(qIndex, "imageLayout", e.target.value)
                        }
                        className="input-field"
                        style={{
                          padding: "6px",
                          height: "auto",
                          width: "100%",
                          fontSize: "14px",
                        }}
                      >
                        <option value="top">Сверху (над ответами)</option>
                        <option value="left">Слева от ответов</option>
                        <option value="right">Справа от ответов</option>
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        updateQuestion(qIndex, "imageUrl", "");
                        updateQuestion(qIndex, "imageLayout", "top");
                      }}
                      className="btn-icon"
                      style={{ color: "#ef4444", marginTop: "16px" }}
                      title="Удалить фото"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
              {/* КОНЕЦ БЛОКА С КАРТИНКАМИ */}

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
            Теперь вы можете скопировать ссылку и отправить её ученикам:
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
