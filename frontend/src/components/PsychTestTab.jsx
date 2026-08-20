import React, { useState, useEffect } from "react";
import { Folder, FolderPlus, Link, AlertTriangle, Trash2 } from "lucide-react";
import { psychQuestions } from "./psychQuestions"; // Подключаем все 111 вопросов

const PsychTestTab = () => {
  // Инициализируем папки из localStorage для единой синхронизации с Анализатором/Конструктором
  const [folders, setFolders] = useState(() => {
    const saved = localStorage.getItem("testBuilderFolders");
    return saved
      ? JSON.parse(saved)
      : [
          { id: "1", name: "Папка 1" },
          { id: "2", name: "Группа 101-А" },
        ];
  });

  const [activeFolderId, setActiveFolderId] = useState("1");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Убрали фейковых студентов. Массив пуст, пока никто не прошел.
  const [submissions, setSubmissions] = useState([]);

  // Синхронизация папок при изменениях
  useEffect(() => {
    localStorage.setItem("testBuilderFolders", JSON.stringify(folders));
    window.dispatchEvent(new Event("foldersUpdated")); // Уведомляем другие вкладки
  }, [folders]);

  // Слушаем изменения папок из других модулей (Конструктор/Анализатор)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("testBuilderFolders");
      if (saved) setFolders(JSON.parse(saved));
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("foldersUpdated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("foldersUpdated", handleStorageChange);
    };
  }, []);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/psych-test`;
    navigator.clipboard.writeText(link);
    alert(`Ссылка скопирована: ${link}`);
  };

  // --- ЛОГИКА ПАПОК ---
  const handleAddFolder = () => {
    const folderName = prompt("Введите название новой папки:");
    if (folderName && folderName.trim()) {
      const newFolder = { id: Date.now().toString(), name: folderName.trim() };
      setFolders([...folders, newFolder]);
      setActiveFolderId(newFolder.id);
    }
  };

  const handleDeleteFolder = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Уверены, что хотите удалить эту папку?")) {
      const newFolders = folders.filter((f) => f.id !== id);
      setFolders(newFolders);
      if (activeFolderId === id && newFolders.length > 0) {
        setActiveFolderId(newFolders[0].id);
      } else if (newFolders.length === 0) {
        setActiveFolderId(null);
      }
    }
  };

  const filteredSubmissions = submissions.filter(
    (sub) => sub.folderId === activeFolderId,
  );

  return (
    <div
      style={{ display: "flex", gap: "20px", width: "100%", height: "100%" }}
    >
      {/* ЛЕВАЯ КОЛОНКА */}
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
              onClick={handleAddFolder}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "#2563eb",
              }}
              title="Добавить папку"
            >
              <FolderPlus size={18} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {folders.length === 0 && (
              <p style={{ fontSize: "13px", color: "#94a3b8" }}>Нет папок</p>
            )}
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
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background:
                    activeFolderId === f.id ? "#eff6ff" : "transparent",
                  color: activeFolderId === f.id ? "#2563eb" : "#334155",
                  fontWeight: activeFolderId === f.id ? "600" : "400",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Folder size={16} />
                  <span>{f.name}</span>
                </div>
                {/* Кнопка удаления папки */}
                <button
                  onClick={(e) => handleDeleteFolder(e, f.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: activeFolderId === f.id ? "#3b82f6" : "#cbd5e1",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Удалить папку"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Блок студентов */}
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
            <p
              style={{
                fontSize: "13px",
                color: "#94a3b8",
                textAlign: "center",
                marginTop: "20px",
              }}
            >
              В этой папке пока нет ответов. Отправьте ссылку студентам, чтобы
              собрать данные.
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {filteredSubmissions.map((sub) => (
                <div key={sub.id}>{/* Рендер студента */}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ПРАВАЯ КОЛОНКА */}
      <div
        style={{
          flex: 1,
          background: "#fff",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          overflowY: "auto",
          maxHeight: "calc(100vh - 120px)",
        }}
      >
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
                : `Всего вопросов: ${psychQuestions.length}`}
            </span>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
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

        {selectedStudent ? (
          <div> {/* Блок с результатами (скрыт, пока нет данных) */} </div>
        ) : (
          /* ПОЛНЫЙ СПИСОК ВОПРОСОВ (111 ШТ) */
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {psychQuestions.map((q) => (
              <div
                key={q.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px",
                  background: "#f8fafc",
                  borderRadius: "6px",
                  border: "1px solid #f1f5f9",
                }}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    width: "35px",
                    color: "#94a3b8",
                  }}
                >
                  {q.id}.
                </span>
                <span
                  style={{ flex: 1, color: "#334155", paddingRight: "15px" }}
                >
                  {q.text}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    background: "#e0f2fe",
                    color: "#0369a1",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {q.scale}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PsychTestTab;
