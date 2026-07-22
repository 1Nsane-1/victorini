import React, { useState, useMemo, useEffect } from "react";
import {
  UploadCloud,
  Users,
  CheckCircle,
  XCircle,
  Crown,
  Search,
  ArrowUpDown,
  Trash2,
  TrendingUp,
  TrendingDown,
  Download,
  FolderPlus,
  Edit3,
} from "lucide-react";

const letterFor = (i) => String.fromCharCode(65 + i);

const STORAGE_RESULTS_KEY = "quiz-builder:analyzer-results-v2";
const STORAGE_FOLDERS_KEY = "quiz-builder:analyzer-folders";
const MAX_FOLDERS = 15;
const MAX_RESULTS_PER_FOLDER = 100;

const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function Analyzer() {
  // Список папок
  const [folders, setFolders] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_FOLDERS_KEY);
      return raw ? JSON.parse(raw) : ["ИСП33", "Другие", "Архив"];
    } catch {
      return ["ИСП33", "Другие", "Архив"];
    }
  });

  const [currentFolder, setCurrentFolder] = useState(folders[0] || "ИСП33");

  // Все результаты. Каждый объект теперь имеет свойство folder
  const [results, setResults] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_RESULTS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return parsed.map((r) => (r._id ? r : { ...r, _id: makeId() }));
    } catch {
      return [];
    }
  });

  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("score");
  const [sortDir, setSortDir] = useState("desc");
  const [notice, setNotice] = useState("");

  // Сохранение данных в LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_FOLDERS_KEY, JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_RESULTS_KEY, JSON.stringify(results));
  }, [results]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  // Фильтруем результаты строго по текущей активной папке
  const folderResults = useMemo(() => {
    return results.filter((r) => r.folder === currentFolder);
  }, [results, currentFolder]);

  const selectedStudent =
    folderResults.find((r) => r._id === selectedId) || null;

  // Управление папками
  const handleAddFolder = () => {
    if (folders.length >= MAX_FOLDERS) {
      alert(`Нельзя создать более ${MAX_FOLDERS} папок.`);
      return;
    }
    const name = prompt("Введите название новой папки:");
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    if (folders.includes(trimmed)) {
      alert("Папка с таким названием уже существует.");
      return;
    }
    setFolders([...folders, trimmed]);
    setCurrentFolder(trimmed);
  };

  const handleRenameFolder = () => {
    const newName = prompt(
      `Переименовать папку "${currentFolder}" в:`,
      currentFolder,
    );
    if (!newName || !newName.trim() || newName.trim() === currentFolder) return;
    const trimmed = newName.trim();

    if (folders.includes(trimmed)) {
      alert("Папка с таким названием уже существует.");
      return;
    }

    // Обновляем имя в списке папок и во всех связанных результатах
    setFolders(folders.map((f) => (f === currentFolder ? trimmed : f)));
    setResults(
      results.map((r) =>
        r.folder === currentFolder ? { ...r, folder: trimmed } : r,
      ),
    );
    setCurrentFolder(trimmed);
    setNotice(`Папка переименована в "${trimmed}"`);
  };

  const handleDeleteFolder = () => {
    if (folders.length <= 1) {
      alert("Должна оставаться как минимум одна папка.");
      return;
    }
    if (
      !window.confirm(
        `Вы уверены, что хотите удалить папку "${currentFolder}" и ВСЕ её результаты безвозвратно?`,
      )
    )
      return;

    const remainingFolders = folders.filter((f) => f !== currentFolder);
    setResults(results.filter((r) => r.folder !== currentFolder));
    setFolders(remainingFolders);
    setCurrentFolder(remainingFolders[0]);
    setSelectedId(null);
    setNotice("Папка успешно удалена");
  };

  // Загрузка файлов
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Проверяем лимит текущей папки
    if (folderResults.length + files.length > MAX_RESULTS_PER_FOLDER) {
      alert(
        `Ошибка! В одной папке разрешено хранить не более ${MAX_RESULTS_PER_FOLDER} результатов. Сейчас в ней: ${folderResults.length}`,
      );
      e.target.value = "";
      return;
    }

    // Чтение для UI
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result);
          setResults((prev) => [
            ...prev,
            { ...json, _id: makeId(), folder: currentFolder },
          ]);
        } catch (error) {
          console.error("Ошибка чтения локального файла", file.name);
        }
      };
      reader.readAsText(file);
    });

    // Отправка на бэкенд
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("folder", currentFolder);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        setNotice(
          `Файлы (${files.length} шт.) успешно загружены в папку: ${currentFolder}`,
        );
      }
    } catch (err) {
      console.error("Ошибка сохранения на сервере", err);
    }

    e.target.value = "";
  };

  // Экспорт
  const handleExport = async (format) => {
    if (!filteredResults.length) return;
    setNotice(`Подготовка ${format.toUpperCase()}...`);

    try {
      const res = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: filteredResults }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentFolder}_results.${format === "excel" ? "xlsx" : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setNotice("Ошибка экспорта");
    }
  };

  // Поштучное удаление студента
  const handleDeleteSingle = (id, e) => {
    e.stopPropagation(); // Чтобы не срабатывал клик по строке (выбор студента)
    if (!window.confirm("Удалить этот результат?")) return;

    setResults(results.filter((r) => r._id !== id));
    if (selectedId === id) setSelectedId(null);
    setNotice("Результат удален");
  };

  // Очистка ВСЕЙ текущей папки
  const clearCurrentFolder = () => {
    if (
      !window.confirm(
        `Очистить все результаты внутри папки "${currentFolder}"?`,
      )
    )
      return;
    setResults(results.filter((r) => r.folder !== currentFolder));
    setSelectedId(null);
  };

  // Вычисление изолированной статистики по выбранной папке
  const totalStudents = folderResults.length;
  const passedStudents = folderResults.filter((r) => r.passed).length;
  const avgScore = totalStudents
    ? folderResults.reduce((acc, curr) => acc + curr.score, 0) / totalStudents
    : 0;
  const passRate = totalStudents
    ? Math.round((passedStudents / totalStudents) * 100)
    : 0;

  const median = useMemo(() => {
    if (!totalStudents) return 0;
    const sorted = [...folderResults].map((r) => r.score).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }, [folderResults, totalStudents]);

  const best = useMemo(
    () =>
      totalStudents
        ? folderResults.reduce((a, b) => (b.score > a.score ? b : a))
        : null,
    [folderResults, totalStudents],
  );

  // Фильтрация и сортировка таблицы (внутри текущей папки)
  const filteredResults = useMemo(() => {
    return folderResults
      .filter((r) => (r.fio || "").toLowerCase().includes(search.toLowerCase()))
      .filter((r) => {
        if (statusFilter === "passed") return r.passed;
        if (statusFilter === "failed") return !r.passed;
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === "score") cmp = a.score - b.score;
        else if (sortKey === "name")
          cmp = (a.fio || "").localeCompare(b.fio || "", "ru");
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [folderResults, search, statusFilter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const rankOf = (id) => {
    const sorted = [...folderResults].sort((a, b) => b.score - a.score);
    return sorted.findIndex((r) => r._id === id) + 1;
  };

  const selectedIndexInList = selectedStudent
    ? filteredResults.findIndex((r) => r._id === selectedStudent._id)
    : -1;

  const goPrev = () => {
    if (selectedIndexInList > 0)
      setSelectedId(filteredResults[selectedIndexInList - 1]._id);
  };

  const goNext = () => {
    if (
      selectedIndexInList >= 0 &&
      selectedIndexInList < filteredResults.length - 1
    )
      setSelectedId(filteredResults[selectedIndexInList + 1]._id);
  };

  return (
    <div>
      {/* ПАНЕЛЬ УПРАВЛЕНИЯ ПАПКАМИ */}
      <div
        className="card"
        style={{ marginBottom: "20px", padding: "16px 20px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <label
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "var(--text-main)",
              }}
            >
              Активная папка ({folders.length}/{MAX_FOLDERS}):
            </label>
            <select
              value={currentFolder}
              onChange={(e) => {
                setCurrentFolder(e.target.value);
                setSelectedId(null);
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                outline: "none",
                fontWeight: "600",
                backgroundColor: "#fff",
                cursor: "pointer",
              }}
            >
              {folders.map((folder) => (
                <option key={folder} value={folder}>
                  {folder}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleAddFolder}
              style={folderActionBtnStyle}
              title="Создать новую папку"
            >
              <FolderPlus size={16} /> Добавить
            </button>
            <button
              onClick={handleRenameFolder}
              style={folderActionBtnStyle}
              title="Переименовать текущую папку"
            >
              <Edit3 size={16} /> Переименовать
            </button>
            <button
              onClick={handleDeleteFolder}
              style={{
                ...folderActionBtnStyle,
                color: "var(--danger)",
                borderColor: "rgba(239,68,68,0.2)",
              }}
              title="Удалить папку и данные"
            >
              <Trash2 size={16} /> Удалить папку
            </button>
          </div>
        </div>
      </div>

      {/* Зона загрузки файлов */}
      <div
        className="card"
        style={{
          border: "2px dashed var(--border)",
          textAlign: "center",
          position: "relative",
          transition: "all 0.2s",
          padding: "32px",
          marginBottom: "24px",
        }}
        onMouseOver={(e) =>
          (e.currentTarget.style.borderColor = "var(--primary)")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.borderColor = "var(--border)")
        }
      >
        <input
          type="file"
          multiple
          accept=".json"
          onChange={handleFileUpload}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            cursor: "pointer",
            zIndex: 1,
          }}
        />
        <UploadCloud
          size={40}
          style={{ color: "var(--text-muted)", margin: "0 auto 12px" }}
        />
        <h3
          style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}
        >
          Загрузить файлы в папку «{currentFolder}»
        </h3>
        <p className="text-muted" style={{ fontSize: "13px" }}>
          Перетащите результаты (.json) сюда. Лимит: {totalStudents} /{" "}
          {MAX_RESULTS_PER_FOLDER} файлов.
        </p>
      </div>

      {notice && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            background: "var(--success-bg)",
            color: "var(--success)",
            padding: "16px 24px",
            borderRadius: "12px",
            boxShadow:
              "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
            fontWeight: "600",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            transition: "all 0.3s ease-in-out",
          }}
        >
          <CheckCircle size={18} style={{ marginRight: "8px" }} />
          {notice}
        </div>
      )}

      {totalStudents === 0 ? (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "48px",
            color: "var(--text-muted)",
          }}
        >
          В папке <b>{currentFolder}</b> пока нет загруженных результатов.
          Статистика появится после импорта файлов.
        </div>
      ) : (
        <>
          {/* Сводная статистика */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <StatCard
              icon={<Users size={20} />}
              value={totalStudents}
              label="Сдавших"
            />
            <StatCard
              icon={<CheckCircle size={20} />}
              value={passedStudents}
              label="Успешно"
              color="var(--success)"
            />
            <StatCard
              icon={<XCircle size={20} />}
              value={totalStudents - passedStudents}
              label="Провалили"
              color="var(--danger)"
            />
            <StatCard
              value={`${passRate}%`}
              label="Процент сдачи"
              color="var(--primary)"
            />
            <StatCard value={avgScore.toFixed(1)} label="Ср. балл" />
            <StatCard value={median} label="Медиана" />
            <StatCard
              icon={<Crown size={18} />}
              value={best?.score || 0}
              label={`Лучший: ${best?.fio?.split(" ")[0] || "—"}`}
              color="#d97706"
            />
          </div>

          {/* Нижняя часть: Таблица результатов и Панель Деталей */}
          <div
            style={{
              display: "flex",
              gap: "24px",
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            {/* Таблица */}
            <div
              className="card"
              style={{ flex: "1 1 400px", padding: 0, overflow: "hidden" }}
            >
              <div
                style={{
                  padding: "20px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{ position: "relative", flex: "1", minWidth: "200px" }}
                >
                  <Search
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "12px",
                      color: "var(--text-muted)",
                    }}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск по ФИО..."
                    className="input-field"
                    style={{
                      paddingLeft: "36px",
                      paddingRight: "12px",
                      paddingTop: "10px",
                      paddingBottom: "10px",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <FilterPill
                    active={statusFilter === "all"}
                    onClick={() => setStatusFilter("all")}
                  >
                    Все
                  </FilterPill>
                  <FilterPill
                    active={statusFilter === "passed"}
                    onClick={() => setStatusFilter("passed")}
                    color="var(--success)"
                  >
                    Сдали
                  </FilterPill>
                  <FilterPill
                    active={statusFilter === "failed"}
                    onClick={() => setStatusFilter("failed")}
                    color="var(--danger)"
                  >
                    Не сдали
                  </FilterPill>
                </div>
              </div>

              {/* Действия над таблицей */}
              <div
                style={{
                  padding: "12px 20px",
                  background: "#f9fafb",
                  display: "flex",
                  gap: "8px",
                  borderBottom: "1px solid var(--border)",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    marginRight: "8px",
                  }}
                >
                  Экспорт папки:
                </span>
                <button
                  onClick={() => handleExport("pdf")}
                  style={exportBtnStyle}
                >
                  <Download size={14} /> PDF
                </button>
                <button
                  onClick={() => handleExport("docx")}
                  style={exportBtnStyle}
                >
                  <Download size={14} /> DOCX
                </button>
                <button
                  onClick={() => handleExport("excel")}
                  style={exportBtnStyle}
                >
                  <Download size={14} /> EXCEL
                </button>
                <button
                  onClick={clearCurrentFolder}
                  className="btn-icon"
                  title="Очистить всю папку"
                  style={{ marginLeft: "auto", color: "var(--danger)" }}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#f9fafb",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <th style={{ padding: "12px 20px" }}>
                        <button
                          onClick={() => toggleSort("name")}
                          style={tableHeaderBtnStyle}
                        >
                          ФИО <ArrowUpDown size={14} />
                        </button>
                      </th>
                      <th style={{ padding: "12px 20px" }}>
                        <button
                          onClick={() => toggleSort("score")}
                          style={tableHeaderBtnStyle}
                        >
                          Балл <ArrowUpDown size={14} />
                        </button>
                      </th>
                      <th
                        style={{
                          padding: "12px 20px",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "var(--text-muted)",
                        }}
                      >
                        Статус
                      </th>
                      <th
                        style={{ padding: "12px 20px", textAlign: "center" }}
                      ></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((res) => (
                      <tr
                        key={res._id}
                        onClick={() => setSelectedId(res._id)}
                        style={{
                          borderBottom: "1px solid #f3f4f6",
                          cursor: "pointer",
                          background:
                            selectedId === res._id ? "#eff6ff" : "white",
                          transition: "background 0.2s",
                        }}
                        className="table-row-hover"
                      >
                        <td
                          style={{
                            padding: "16px 20px",
                            fontWeight: "500",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {best && res.fio === best.fio && (
                            <Crown size={16} color="#d97706" />
                          )}
                          {res.fio}
                        </td>
                        <td style={{ padding: "16px 20px", fontWeight: "600" }}>
                          {res.score}{" "}
                          <span
                            style={{
                              color: "var(--text-muted)",
                              fontSize: "12px",
                              fontWeight: "400",
                            }}
                          >
                            / {res.maxScore}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: "600",
                              background: res.passed
                                ? "var(--success-bg)"
                                : "var(--danger-bg)",
                              color: res.passed
                                ? "var(--success)"
                                : "var(--danger)",
                            }}
                          >
                            {res.passed ? "Сдал" : "Не сдал"}
                          </span>
                        </td>
                        {/* Кнопка удаления отдельной записи */}
                        <td
                          style={{ padding: "16px 20px", textAlign: "center" }}
                        >
                          <button
                            onClick={(e) => handleDeleteSingle(res._id, e)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                              padding: "4px",
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.color = "var(--danger)")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.color =
                                "var(--text-muted)")
                            }
                            title="Удалить этот результат"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredResults.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            padding: "32px",
                            textAlign: "center",
                            color: "var(--text-muted)",
                          }}
                        >
                          Ничего не найдено
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Детали студента */}
            {selectedStudent && (
              <div
                className="card"
                style={{ flex: "1 1 350px", position: "sticky", top: "24px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyBox: "space-between",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <button
                    onClick={goPrev}
                    disabled={selectedIndexInList <= 0}
                    style={navStudentBtnStyle(selectedIndexInList <= 0)}
                  >
                    ← Пред.
                  </button>
                  <span className="text-muted" style={{ fontSize: "12px" }}>
                    {selectedIndexInList + 1} из {filteredResults.length}
                  </span>
                  <button
                    onClick={goNext}
                    disabled={selectedIndexInList >= filteredResults.length - 1}
                    style={navStudentBtnStyle(
                      selectedIndexInList >= filteredResults.length - 1,
                    )}
                  >
                    След. →
                  </button>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      marginBottom: "4px",
                    }}
                  >
                    {selectedStudent.fio}
                  </h2>
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                      fontSize: "13px",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>
                      Место {rankOf(selectedStudent._id)} из {totalStudents}
                    </span>
                    {totalStudents > 1 && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          color:
                            selectedStudent.score > avgScore
                              ? "var(--success)"
                              : selectedStudent.score < avgScore
                                ? "var(--danger)"
                                : "inherit",
                        }}
                      >
                        {selectedStudent.score > avgScore ? (
                          <TrendingUp size={14} />
                        ) : selectedStudent.score < avgScore ? (
                          <TrendingDown size={14} />
                        ) : null}
                        {selectedStudent.score > avgScore
                          ? "Выше среднего"
                          : selectedStudent.score < avgScore
                            ? "Ниже среднего"
                            : "Средний результат"}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    marginBottom: "24px",
                    padding: "16px",
                    background: "#f9fafb",
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        marginBottom: "4px",
                      }}
                    >
                      Набрано баллов
                    </div>
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: "700",
                        color: selectedStudent.passed
                          ? "var(--success)"
                          : "var(--danger)",
                      }}
                    >
                      {selectedStudent.score}{" "}
                      <span
                        style={{
                          fontSize: "16px",
                          color: "var(--text-muted)",
                          fontWeight: "500",
                        }}
                      >
                        / {selectedStudent.maxScore}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{ width: "1px", background: "var(--border)" }}
                  ></div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        marginBottom: "4px",
                      }}
                    >
                      Статус
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        marginTop: "6px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        color: selectedStudent.passed
                          ? "var(--success)"
                          : "var(--danger)",
                      }}
                    >
                      {selectedStudent.passed ? (
                        <CheckCircle size={18} />
                      ) : (
                        <XCircle size={18} />
                      )}
                      {selectedStudent.passed ? "Пройден" : "Провален"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    maxHeight: "400px",
                    overflowY: "auto",
                    paddingRight: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {selectedStudent.details.map((det, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "16px",
                        borderRadius: "12px",
                        border: "1px solid var(--border)",
                        borderLeft: `4px solid ${det.isCorrect ? "var(--success)" : "var(--danger)"}`,
                        background: det.isCorrect
                          ? "var(--success-bg)"
                          : "var(--danger-bg)",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          marginBottom: "8px",
                        }}
                      >
                        {idx + 1}. {det.question}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "13px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                            color: det.isCorrect
                              ? "var(--success)"
                              : "var(--danger)",
                          }}
                        >
                          {det.isCorrect ? "✓ Верно" : "✗ Ошибка"}
                        </span>
                        {!det.isCorrect && (
                          <span style={{ color: "var(--text-muted)" }}>
                            Выбрано:{" "}
                            <b style={{ color: "var(--text-main)" }}>
                              {det.userAnswers
                                .map((i) => letterFor(i))
                                .join(", ") || "—"}
                            </b>{" "}
                            · Верно:{" "}
                            <b style={{ color: "var(--text-main)" }}>
                              {det.correctAnswers
                                .map((i) => letterFor(i))
                                .join(", ")}
                            </b>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Вспомогательные компоненты / стили
function StatCard({ icon, value, label, color = "var(--text-main)" }) {
  return (
    <div
      className="card"
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        marginBottom: 0,
      }}
    >
      {icon && <div style={{ color, marginBottom: "8px" }}>{icon}</div>}
      <div
        style={{
          fontSize: "24px",
          fontWeight: "700",
          color,
          lineHeight: "1.2",
          marginBottom: "4px",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "600",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, children, color = "var(--primary)" }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        border: `1px solid ${active ? color : "var(--border)"}`,
        background: active
          ? color === "var(--primary)"
            ? "#eff6ff"
            : color === "var(--success)"
              ? "var(--success-bg)"
              : "var(--danger-bg)"
          : "transparent",
        color: active ? color : "var(--text-muted)",
        transition: "all 0.2s",
      }}
    >
      {children}
    </button>
  );
}

const folderActionBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 14px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "#fff",
  fontSize: "13px",
  fontWeight: "600",
  color: "var(--text-main)",
  cursor: "pointer",
  transition: "all 0.2s",
};

const exportBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 12px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "white",
  color: "var(--text-main)",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
};

const tableHeaderBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "600",
  color: "var(--text-muted)",
};

const navStudentBtnStyle = (disabled) => ({
  background: "none",
  border: "none",
  color: "var(--primary)",
  cursor: disabled ? "default" : "pointer",
  opacity: disabled ? 0.3 : 1,
  fontSize: "13px",
  fontWeight: "600",
});
