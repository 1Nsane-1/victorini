import React, { useState } from "react";
import {
  Folder,
  FolderPlus,
  Link,
  UserCheck,
  AlertTriangle,
  FileText,
} from "lucide-react";

// Первые вопросы из нашей базы 111 вопросов
const sampleQuestions = [
  {
    id: 1,
    text: "Я легко начинаю разговор с незнакомыми людьми.",
    scale: "Экстраверсия",
    type: "Прямой",
  },
  {
    id: 2,
    text: "Я часто испытываю чувство тревоги без видимой причины.",
    scale: "Нейротизм",
    type: "Прямой",
  },
  {
    id: 3,
    text: "Я стараюсь во всем помогать окружающим, если могу.",
    scale: "Доброжелательность",
    type: "Прямой",
  },
  {
    id: 4,
    text: "Я никогда в жизни ни разу не обманывал.",
    scale: "Шкала лжи",
    type: "Прямой",
  },
  {
    id: 5,
    text: "Я всегда содержу свои вещи в идеальном порядке.",
    scale: "Добросовестность",
    type: "Прямой",
  },
];

const PsychTestTab = () => {
  const [folders, setFolders] = useState([
    { id: "1", name: "Папка 1" },
    { id: "2", name: "Группа 101-А" },
  ]);
  const [activeFolderId, setActiveFolderId] = useState("1");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Моковые данные сдавших студентов
  const [submissions] = useState([
    {
      id: "sub_1",
      folderId: "1",
      studentName: "Иванов Иван Иванович",
      gender: "Мужской",
      date: "18.08.2026",
      isInvalid: false,
      scores: {
        extroversion: 65,
        neuroticism: 25,
        agreeableness: 80,
        conscientiousness: 75,
        openness: 88,
      },
    },
    {
      id: "sub_2",
      folderId: "1",
      studentName: "Петров Петр Петрович",
      gender: "Мужской",
      date: "17.08.2026",
      isInvalid: true, // Провалил шкалу лжи
      scores: {},
    },
  ]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/psych-test`;
    navigator.clipboard.writeText(link);
    alert(`Ссылка скопирована в буфер обмена: ${link}`);
  };

  const filteredSubmissions = submissions.filter(
    (sub) => sub.folderId === activeFolderId,
  );

  return (
    <div
      style={{ display: "flex", gap: "20px", width: "100%", height: "100%" }}
    >
      {/* ЛЕВАЯ КОЛОНКА (Сайдбар: Папки + Студенты) */}
      <div
        style={{
          width: "300px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        {/* Блок папок */}
        <div
          style={{
            background: "#fff",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <strong style={{ fontSize: "14px", color: "#475569" }}>
              Папки результатов
            </strong>
            <button
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "#2563eb",
              }}
            >
              <FolderPlus size={18} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {folders.map((f) => (
              <div
                key={f.id}
                onClick={() => {
                  setActiveFolderId(f.id);
                  setSelectedStudent(null);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background:
                    activeFolderId === f.id ? "#eff6ff" : "transparent",
                  color: activeFolderId === f.id ? "#2563eb" : "#334155",
                  fontWeight: activeFolderId === f.id ? "600" : "400",
                }}
              >
                <Folder size={16} />
                <span>{f.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Блок списка студентов */}
        <div
          style={{
            background: "#fff",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            flex: 1,
          }}
        >
          <strong
            style={{
              fontSize: "14px",
              color: "#475569",
              display: "block",
              marginBottom: "10px",
            }}
          >
            Результаты студентов
          </strong>

          {filteredSubmissions.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>
              В этой папке пока нет ответов
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {filteredSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => setSelectedStudent(sub)}
                  style={{
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    cursor: "pointer",
                    background:
                      selectedStudent?.id === sub.id ? "#f8fafc" : "#fff",
                    borderColor:
                      selectedStudent?.id === sub.id ? "#2563eb" : "#e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: "600",
                        fontSize: "14px",
                        color: sub.isInvalid ? "#dc2626" : "#1e293b",
                      }}
                    >
                      {sub.studentName}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      marginTop: "4px",
                    }}
                  >
                    {sub.date} • {sub.isInvalid ? "⚠️ Ложь" : "Пройден"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ПРАВАЯ КОЛОНКА (Вопросы или Результаты) */}
      <div
        style={{
          flex: 1,
          background: "#fff",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          overflowY: "auto",
        }}
      >
        {/* Шапка правой колонки */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "15px",
            borderBottom: "1px solid #e2e8f0",
            marginBottom: "20px",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "18px" }}>
              {selectedStudent
                ? `Результаты: ${selectedStudent.studentName}`
                : "Методика «Большая Пятерка» (Big Five)"}
            </h2>
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              {selectedStudent
                ? `Дата сдачи: ${selectedStudent.date}`
                : "Всего вопросов: 111"}
            </span>
          </div>

          <div style={{ display: "flex", gap: "100px" }}>
            {selectedStudent && (
              <button
                onClick={() => setSelectedStudent(null)}
                style={{
                  padding: "8px 12px",
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                К списку вопросов
              </button>
            )}
            <button
              onClick={handleCopyLink}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              <Link size={16} /> Скопировать ссылку на тест
            </button>
          </div>
        </div>

        {/* Контент: Просмотр результатов студента */}
        {selectedStudent ? (
          <div>
            {selectedStudent.isInvalid ? (
              <div
                style={{
                  background: "#fef2f2",
                  color: "#991b1b",
                  padding: "15px",
                  borderRadius: "6px",
                  border: "1px solid #fecaca",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: "bold",
                  }}
                >
                  <AlertTriangle size={20} /> Результат может быть неточным
                </div>
                <p style={{ margin: "8px 0 0 0", fontSize: "14px" }}>
                  Пользователь набрал высокий балл по Шкале лжи. Похоже, ответы
                  давались так, чтобы казаться лучше.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div>Экстраверсия: {selectedStudent.scores.extroversion}%</div>
                <div>Нейротизм: {selectedStudent.scores.neuroticism}%</div>
                <div>
                  Доброжелательность: {selectedStudent.scores.agreeableness}%
                </div>
                <div>
                  Добросовестность: {selectedStudent.scores.conscientiousness}%
                </div>
                <div>Открытость опыту: {selectedStudent.scores.openness}%</div>
              </div>
            )}
          </div>
        ) : (
          /* Контент: Список вопросов теста */
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {sampleQuestions.map((q) => (
              <div
                key={q.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyBetween: "space-between",
                  padding: "10px",
                  background: "#f8fafc",
                  borderRadius: "6px",
                  border: "1px solid #f1f5f9",
                }}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    width: "30px",
                    color: "#94a3b8",
                  }}
                >
                  {q.id}.
                </span>
                <span style={{ flex: 1, color: "#334155" }}>{q.text}</span>
                <span
                  style={{
                    fontSize: "12px",
                    background: "#e0f2fe",
                    color: "#0369a1",
                    padding: "2px 8px",
                    borderRadius: "12px",
                  }}
                >
                  {q.scale}
                </span>
              </div>
            ))}
            <div
              style={{
                textAlign: "center",
                color: "#94a3b8",
                fontSize: "13px",
                marginTop: "10px",
              }}
            >
              ... и еще 106 вопросов в базе данных ...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PsychTestTab;
