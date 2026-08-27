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
    window.location.href = `/quiz/${surveyId}`;
  };

  const handleDelete = async (surveyId) => {
    const isConfirmed = window.confirm(
      "Вы уверены, что хотите удалить этот тест?",
    );
    if (!isConfirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/surveys/${surveyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Убираем удаленный тест из списка на экране
        setSurveys(surveys.filter((survey) => survey._id !== surveyId));
      } else {
        alert("Не удалось удалить тест.");
      }
    } catch (error) {
      console.error("Ошибка при удалении:", error);
      alert("Ошибка соединения с сервером.");
    }
  };

  // Функция для красивого отображения JSON-настроек из конструктора
  const renderDescription = (desc) => {
    if (!desc) return null;
    try {
      if (desc.startsWith("{")) {
        const parsed = JSON.parse(desc);
        return (
          <div
            style={{
              fontSize: "14px",
              color: "#555",
              marginTop: "12px",
              marginBottom: "12px",
            }}
          >
            <p style={{ margin: "4px 0" }}>
              <strong>Папка:</strong> {parsed.folder || "Не указана"}
            </p>
            <p style={{ margin: "4px 0" }}>
              <strong>Проходной балл:</strong> {parsed.passScore}{" "}
              {parsed.passMode === "percentage" ? "%" : "баллов"}
            </p>
          </div>
        );
      }
    } catch (e) {
      // Если это не JSON, просто игнорируем ошибку и выводим как текст
    }
    return (
      <p
        style={{
          color: "#666",
          fontSize: "14px",
          wordBreak: "break-word",
          marginTop: "8px",
        }}
      >
        {desc}
      </p>
    );
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
            display: "grid",
            // Сетка автоматически подстраивает карточки по ширине, растягивая их при необходимости
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          {surveys.map((survey) => (
            <div
              key={survey._id}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "10px",
                padding: "20px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                backgroundColor: "#fff",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between", // Распределяет контент, прижимая кнопки к низу
              }}
            >
              <div>
                <h3
                  style={{
                    margin: "0 0 8px 0",
                    wordBreak: "break-word",
                    color: "#333",
                  }}
                >
                  {survey.title || "Тест без названия"}
                </h3>
                {renderDescription(survey.description)}
              </div>

              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid #eee",
                  paddingTop: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "#10b981",
                    fontWeight: "600",
                  }}
                >
                  ● Активен
                </span>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => handleDelete(survey._id)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#ef4444", // Красная кнопка удаления
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "opacity 0.2s",
                    }}
                    onMouseOver={(e) => (e.target.style.opacity = 0.8)}
                    onMouseOut={(e) => (e.target.style.opacity = 1)}
                  >
                    Удалить
                  </button>

                  <button
                    onClick={() => handleStartTest(survey._id)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#3b82f6", // Синяя кнопка прохождения
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "opacity 0.2s",
                    }}
                    onMouseOver={(e) => (e.target.style.opacity = 0.8)}
                    onMouseOut={(e) => (e.target.style.opacity = 1)}
                  >
                    Пройти
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
