import React, { useState, useEffect } from "react";
import { psychQuestions } from "./psychQuestions";

export default function PsychQuizPlayer() {
  const [step, setStep] = useState(0);
  const [folders, setFolders] = useState([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);
  const [studentInfo, setStudentInfo] = useState({
    fullName: "",
    gender: "Мужской",
    folderId: "",
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Загрузка папок из localStorage (синхронизация с Конструктором и Анализатором)
  useEffect(() => {
    const loadFolders = () => {
      try {
        const saved = localStorage.getItem("testBuilderFolders");
        if (saved) {
          const parsed = JSON.parse(saved);
          setFolders(parsed);
          if (parsed.length > 0) {
            setStudentInfo((prev) => ({
              ...prev,
              folderId: prev.folderId || parsed[0].id,
            }));
          }
        } else {
          const defaultFolders = [
            { id: "1", name: "Папка 1" },
            { id: "2", name: "Группа 101-А" },
          ];
          setFolders(defaultFolders);
          setStudentInfo((prev) => ({
            ...prev,
            folderId: defaultFolders[0].id,
          }));
        }
      } catch (err) {
        console.error("Ошибка при загрузке папок:", err);
        setError("Не удалось загрузить список папок.");
      } finally {
        setIsLoadingFolders(false);
      }
    };

    loadFolders();

    window.addEventListener("storage", loadFolders);
    window.addEventListener("foldersUpdated", loadFolders);
    return () => {
      window.removeEventListener("storage", loadFolders);
      window.removeEventListener("foldersUpdated", loadFolders);
    };
  }, []);

  const handleChange = (e) => {
    setStudentInfo({ ...studentInfo, [e.target.name]: e.target.value });
  };

  const handleStart = () => {
    if (!studentInfo.fullName.trim()) {
      setError("Пожалуйста, введите ФИО");
      return;
    }
    if (!studentInfo.folderId) {
      setError("Пожалуйста, выберите папку для сохранения");
      return;
    }
    setError("");
    setStep(1);
  };

  const handleAnswerSelect = async (score) => {
    const currentQuestion = psychQuestions[currentQuestionIndex];
    const newAnswers = { ...answers, [currentQuestion.id]: score };
    setAnswers(newAnswers);

    if (currentQuestionIndex < psychQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      await submitResults(newAnswers);
    }
  };

  const submitResults = async (finalAnswers) => {
    setIsSubmitting(true);
    setError("");
    try {
      // 1. Отправляем данные на наш НОВЫЙ бэкенд
      await fetch("http://localhost:3000/api/psych-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentInfo.fullName,
          folder: studentInfo.folderId, // Передаем ID выбранной папки
          answers: finalAnswers,
        }),
      });

      // 2. Оставляем твое локальное сохранение (чтобы не ломать старую логику, если она тебе нужна)
      const newSubmission = {
        id: Date.now().toString(),
        studentName: studentInfo.fullName,
        gender: studentInfo.gender,
        folderId: studentInfo.folderId,
        date: new Date().toLocaleDateString("ru-RU"),
        answers: finalAnswers,
      };
      const existing = JSON.parse(
        localStorage.getItem("psychSubmissions") || "[]",
      );
      existing.push(newSubmission);
      localStorage.setItem("psychSubmissions", JSON.stringify(existing));
      window.dispatchEvent(new Event("psychSubmissionsUpdated"));

      setStep(2);
    } catch (err) {
      console.error("Ошибка при сохранении результатов:", err);
      setError("Произошла ошибка при сохранении результатов.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0",
    marginBottom: "16px",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    outline: "none",
    fontSize: "14px",
    color: "#1e293b",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "6px",
  };

  const greenBtnStyle = {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    background: "#10b981",
    color: "#ffffff",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
    fontSize: "15px",
    transition: "background 0.2s",
  };

  return (
    <div
      style={{
        maxWidth: "680px",
        margin: "30px auto",
        padding: "0 16px",
        fontFamily: "sans-serif",
      }}
    >
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "#fef2f2",
            color: "#ef4444",
            borderRadius: "10px",
            marginBottom: "16px",
            fontSize: "14px",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {step === 0 && (
        <div>
          <div style={cardStyle}>
            <h2
              style={{
                margin: "0 0 20px 0",
                fontSize: "24px",
                fontWeight: "700",
                color: "#0f172a",
              }}
            >
              Психологический тест
            </h2>

            {isLoadingFolders ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#64748b",
                  padding: "20px 0",
                }}
              >
                Загрузка папок...
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div>
                  <label style={labelStyle}>Ваше ФИО / Имя *</label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Введите фамилию и имя..."
                    value={studentInfo.fullName}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Пол</label>
                  <select
                    name="gender"
                    value={studentInfo.gender}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="Мужской">Мужской</option>
                    <option value="Женский">Женский</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>
                    Укажите вашу группу / папки *
                  </label>
                  <select
                    name="folderId"
                    value={studentInfo.folderId}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    {folders.length === 0 ? (
                      <option value="" disabled>
                        Папки не созданы
                      </option>
                    ) : (
                      folders.map((folder) => (
                        <option
                          key={folder.id || folder._id}
                          value={folder.id || folder._id}
                        >
                          {folder.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleStart}
            disabled={folders.length === 0}
            style={{
              ...greenBtnStyle,
              opacity: folders.length === 0 ? 0.6 : 1,
              cursor: folders.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Начать прохождение
          </button>
        </div>
      )}

      {step === 1 && (
        <div>
          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "12px",
                fontSize: "13px",
                color: "#64748b",
                fontWeight: "600",
              }}
            >
              <span>
                Вопрос {currentQuestionIndex + 1} из {psychQuestions.length}
              </span>
              <span>
                Папка:{" "}
                {
                  folders.find((f) => (f.id || f._id) === studentInfo.folderId)
                    ?.name
                }
              </span>
            </div>

            <div
              style={{
                width: "100%",
                height: "6px",
                background: "#f1f5f9",
                borderRadius: "3px",
                marginBottom: "20px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "#10b981",
                  width: `${((currentQuestionIndex + 1) / psychQuestions.length) * 100}%`,
                  transition: "width 0.3s",
                }}
              />
            </div>

            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1e293b",
                margin: "0 0 20px 0",
                lineHeight: "1.5",
              }}
            >
              {currentQuestionIndex + 1}.{" "}
              {psychQuestions[currentQuestionIndex].text}
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {[
                { label: "Совершенно не согласен", score: 1 },
                { label: "Скорее не согласен", score: 2 },
                { label: "Нейтрально / Затрудняюсь ответить", score: 3 },
                { label: "Скорее согласен", score: 4 },
                { label: "Полностью согласен", score: 5 },
              ].map((option) => (
                <button
                  key={option.score}
                  onClick={() => handleAnswerSelect(option.score)}
                  disabled={isSubmitting}
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#334155",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "#10b981";
                    e.currentTarget.style.background = "#ecfdf5";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.background = "#f8fafc";
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div
          style={{ ...cardStyle, textAlign: "center", padding: "40px 24px" }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#0f172a",
              marginBottom: "8px",
            }}
          >
            Тест успешно завершен!
          </h2>
          <p style={{ color: "#64748b", fontSize: "15px", margin: 0 }}>
            Спасибо,{" "}
            <strong style={{ color: "#0f172a" }}>{studentInfo.fullName}</strong>
            . Ваши ответы сохранены.
          </p>
        </div>
      )}
    </div>
  );
}
