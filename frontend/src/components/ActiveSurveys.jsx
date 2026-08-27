import React, { useState, useEffect } from "react";

// Укажи здесь адрес твоего бэкенда на Render или переменную окружения
const API_URL =
  import.meta.env.VITE_API_URL || "https://victorini-api.onrender.com";

export default function ActiveSurveys() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/surveys`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSurveys(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Ошибка загрузки:", err);
        setLoading(false);
      });
  }, []);

  const handleStartTest = (surveyId) => {
    // Переход к плееру теста по роуту /quiz/:id
    window.location.href = `/quiz/${surveyId}`;
  };

  if (loading) return <div style={{ padding: "20px" }}>Загрузка тестов...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Активные тесты и опросы</h2>

      {surveys.length === 0 ? (
        <p>Пока нет ни одного доступного теста.</p>
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            marginTop: "20px",
          }}
        >
          {surveys.map((survey) => (
            <div
              key={survey._id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "16px",
                width: "300px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                backgroundColor: "#fff",
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {survey.title || "Тест без названия"}
              </h3>
              {survey.description && (
                <p style={{ color: "#666", fontSize: "14px" }}>
                  {survey.description}
                </p>
              )}
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "green",
                    fontWeight: "bold",
                  }}
                >
                  Активен
                </span>
                <button
                  onClick={() => handleStartTest(survey._id)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Пройти
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
