import React, { useState, useEffect } from "react";

export default function QuizPlayer({ quizId }) {
  const API_URL =
    import.meta.env.VITE_API_URL || "https://victorini-api.onrender.com";

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [studentName, setStudentName] = useState("");
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [answers, setAnswers] = useState({}); // { questionIndex: [optionIndices] }
  const [submitted, setSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);

  // 1. Загружаем список актуальных папок из Анализатора
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const res = await fetch(`${API_URL}/api/folders`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setFolders(data);
          }
        }
      } catch (err) {
        console.error("Ошибка при загрузке папок:", err);
      }
    };

    fetchFolders();
  }, [API_URL]);

  // 2. Загружаем сам тест
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`${API_URL}/api/surveys/${quizId}`);

        if (!response.ok) {
          throw new Error("Тест не найден или был удален");
        }

        const data = await response.json();
        setQuiz(data);

        if (data.folder) {
          setSelectedFolder(data.folder);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, API_URL]);

  useEffect(() => {
    if (!selectedFolder && folders.length > 0) {
      setSelectedFolder(folders[0]);
    }
  }, [folders, selectedFolder]);

  const handleOptionSelect = (qIndex, oIndex, qType) => {
    const currentAnswers = answers[qIndex] || [];
    if (qType === "radio") {
      setAnswers({ ...answers, [qIndex]: [oIndex] });
    } else {
      if (currentAnswers.includes(oIndex)) {
        setAnswers({
          ...answers,
          [qIndex]: currentAnswers.filter((i) => i !== oIndex),
        });
      } else {
        setAnswers({
          ...answers,
          [qIndex]: [...currentAnswers, oIndex],
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (!studentName.trim()) {
      return alert("Пожалуйста, введите ваше ФИО перед отправкой теста!");
    }

    if (!selectedFolder) {
      return alert("Пожалуйста, выберите вашу группу / папку!");
    }

    if (!quiz || !quiz.blocks) return;

    let settings = {
      pointsPerQuestion: 1,
      passScore: 50,
      passMode: "absolute",
    };
    try {
      settings = JSON.parse(quiz.description);
    } catch (e) {}

    let totalScore = 0;
    let maxPossibleScore = 0;
    const pointsPerQ = Number(settings.pointsPerQuestion) || 1;

    const details = [];

    quiz.blocks.forEach((block, qIndex) => {
      if (block.type === "question") {
        maxPossibleScore += pointsPerQ;
        const correct = block.content.correctAnswers || [];
        const selected = answers[qIndex] || [];

        const isCorrect =
          correct.length === selected.length &&
          correct.every((val) => selected.includes(val));

        if (isCorrect) {
          totalScore += pointsPerQ;
        }

        details.push({
          question: block.content.text || `Вопрос ${qIndex + 1}`,
          isCorrect: isCorrect,
          correctAnswers: correct,
          userAnswers: selected,
        });
      }
    });

    let passed = false;
    const passScore = Number(settings.passScore) || 0;
    if (settings.passMode === "percentage") {
      const percent =
        maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
      passed = percent >= passScore;
    } else {
      passed = totalScore >= passScore;
    }

    const resultData = {
      quizId,
      quizTitle: quiz.title,
      fio: studentName.trim(),
      studentName: studentName.trim(),
      score: totalScore,
      maxScore: maxPossibleScore,
      passed,
      folder: selectedFolder || quiz.folder || "Общая",
      details: details,
      submittedAt: new Date(),
    };

    setScoreResult(resultData);
    setSubmitted(true);

    try {
      await fetch(`${API_URL}/api/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resultData),
      });
    } catch (err) {
      console.error("Ошибка сохранения результатов на сервер:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center", fontSize: "18px" }}>
        ⏳ Загружаем тест...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "60px",
          textAlign: "center",
          color: "#dc2626",
          fontSize: "18px",
        }}
      >
        ❌ Ошибка: {error}
      </div>
    );
  }

  if (submitted && scoreResult) {
    return (
      <div
        style={{
          maxWidth: "600px",
          margin: "60px auto",
          padding: "30px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: "10px" }}>Тест завершен!</h2>
        <p style={{ color: "gray", marginBottom: "20px" }}>{quiz.title}</p>
        <div
          style={{
            padding: "20px",
            background: "#f8fafc",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <p style={{ fontSize: "16px", marginBottom: "8px" }}>
            Студент: <strong>{scoreResult.studentName}</strong>
          </p>
          <p
            style={{ fontSize: "14px", color: "#6b7280", marginBottom: "12px" }}
          >
            Группа / Папка: <strong>{scoreResult.folder}</strong>
          </p>
          <div
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              color: scoreResult.passed ? "#10b981" : "#ef4444",
              margin: "15px 0",
            }}
          >
            {scoreResult.score} / {scoreResult.maxScore} баллов
          </div>
          <p
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: scoreResult.passed ? "#059669" : "#dc2626",
            }}
          >
            {scoreResult.passed
              ? "🎉 Тест сдан успешно!"
              : "❌ Тест не пройден"}
          </p>
        </div>
        <p style={{ color: "gray", fontSize: "14px" }}>
          Результаты автоматически сохранены преподавателю.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "20px auto", padding: "20px" }}>
      {/* Шапка теста */}
      <div className="card" style={{ marginBottom: "20px", padding: "24px" }}>
        <h1 style={{ marginBottom: "16px" }}>{quiz.title}</h1>

        <div style={{ display: "grid", gap: "16px" }}>
          <div>
            <label
              className="form-label"
              style={{
                fontWeight: "600",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Ваше ФИО / Имя:
            </label>
            <input
              type="text"
              placeholder="Введите фамилию и имя..."
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="input-field"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label
              className="form-label"
              style={{
                fontWeight: "600",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Укажите вашу группу / класс:
            </label>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="input-field"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                backgroundColor: "#fff",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              {folders.length === 0 ? (
                <option value="Общая">Общая</option>
              ) : (
                folders.map((folder) => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Список вопросов */}
      {quiz.blocks?.map((block, qIndex) => {
        if (block.type !== "question") return null;
        const q = block.content;

        const layout = q.imageLayout || "top";
        const hasImage = Boolean(q.imageUrl);

        let flexDirection = "column";
        if (hasImage && layout === "left") flexDirection = "row";
        if (hasImage && layout === "right") flexDirection = "row-reverse";

        return (
          <div
            key={qIndex}
            className="card"
            style={{ marginBottom: "20px", padding: "20px" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: flexDirection,
                gap: "20px",
                alignItems: layout === "top" ? "stretch" : "flex-start",
              }}
            >
              {/* Фотография */}
              {hasImage && (
                <div
                  style={{
                    flex: layout === "top" ? "none" : "1",
                    width: layout === "top" ? "100%" : "40%",
                    minWidth: layout === "top" ? "auto" : "200px",
                    marginBottom: layout === "top" ? "15px" : "0",
                  }}
                >
                  <img
                    src={q.imageUrl}
                    alt={`Картинка к вопросу ${qIndex + 1}`}
                    style={{
                      width: "100%",
                      maxHeight: "350px",
                      objectFit: "contain",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                </div>
              )}

              {/* Текст вопроса и варианты */}
              <div style={{ flex: "2", width: "100%" }}>
                <h3 style={{ marginBottom: "15px", fontSize: "16px" }}>
                  {qIndex + 1}. {q.text}
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {q.options.map((opt, oIndex) => {
                    const isSelected = (answers[qIndex] || []).includes(oIndex);
                    return (
                      <label
                        key={oIndex}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 16px",
                          background: isSelected ? "#ecfdf5" : "#f9fafb",
                          border: `1px solid ${isSelected ? "#10b981" : "#e5e7eb"}`,
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        <input
                          type={q.type === "radio" ? "radio" : "checkbox"}
                          name={`question-${qIndex}`}
                          checked={isSelected}
                          onChange={() =>
                            handleOptionSelect(qIndex, oIndex, q.type)
                          }
                          style={{
                            cursor: "pointer",
                            width: "18px",
                            height: "18px",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "15px",
                            color: "var(--text-main)",
                          }}
                        >
                          {opt}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <button
        onClick={handleSubmit}
        className="btn btn-primary"
        style={{
          width: "100%",
          padding: "16px",
          fontSize: "16px",
          background: "#10b981",
          borderColor: "#10b981",
          cursor: "pointer",
          justifyContent: "center",
        }}
      >
        Завершить и отправить ответы
      </button>
    </div>
  );
}
