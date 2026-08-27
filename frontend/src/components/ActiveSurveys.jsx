import React, { useState, useEffect } from "react";
// Если используешь React Router для перехода к тесту:
// import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3000";

export default function ActiveSurveys() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  // const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/surveys`)
      .then((res) => res.json())
      .then((data) => {
        setSurveys(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Ошибка загрузки:", err);
        setLoading(false);
      });
  }, []);

  const handleStartTest = (surveyId) => {
    // Здесь должна быть логика перехода к прохождению теста.
    // Например, если тест открывается по ссылке /quiz/:id :
    // navigate(`/quiz/${surveyId}`);
    console.log("Открываем тест с ID:", surveyId);
  };

  if (loading) return <div>Загрузка тестов...</div>;

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
