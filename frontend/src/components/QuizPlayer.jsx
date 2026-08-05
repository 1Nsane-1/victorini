import React, { useState, useEffect } from "react";

export default function QuizPlayer({ quizId }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const API_URL =
          import.meta.env.VITE_API_URL || "https://victorini-api.onrender.com";
        // Делаем GET запрос на твой бэкенд
        const response = await fetch(`${API_URL}/api/surveys/${quizId}`);

        if (!response.ok) {
          throw new Error("Тест не найден или удален");
        }

        const data = await response.json();
        setQuiz(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontSize: "18px" }}>
        ⏳ Загружаем тест... (Render может просыпаться до 30 секунд)
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "red" }}>
        ❌ Ошибка: {error}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <div
        className="card"
        style={{ textAlign: "center", padding: "40px 20px" }}
      >
        <h1 style={{ marginBottom: "10px" }}>{quiz.title}</h1>
        <p style={{ color: "gray", marginBottom: "20px" }}>
          Успешно загружено из базы данных!
        </p>
        <p>
          Папка для ответов: <strong>{quiz.folder || "Общая"}</strong>
        </p>
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            background: "#f3f4f6",
            borderRadius: "8px",
          }}
        >
          <p>В этом тесте {quiz.blocks?.length || 0} вопросов.</p>
          <p>
            <em>
              (Здесь мы скоро отрисуем сами вопросы и сделаем сбор ответов)
            </em>
          </p>
        </div>
      </div>
    </div>
  );
}
