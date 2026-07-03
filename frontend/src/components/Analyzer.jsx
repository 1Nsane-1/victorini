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
} from "lucide-react";

const letterFor = (i) => String.fromCharCode(65 + i);

const STORAGE_KEY = "quiz-builder:analyzer-results";
const MAX_RESULTS = 50;

const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function Analyzer() {
  const [results, setResults] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    } catch {}
  }, [results]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const selectedStudent = results.find((r) => r._id === selectedId) || null;

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result);
          setResults((prev) => {
            const next = [...prev, { ...json, _id: makeId() }];
            if (next.length > MAX_RESULTS) {
              setNotice(
                `Достигнут лимит ${MAX_RESULTS} результатов — старые записи удалены.`,
              );
              return next.slice(next.length - MAX_RESULTS);
            }
            return next;
          });
        } catch (error) {
          console.error("Ошибка чтения файла", file.name);
        }
      };
      reader.readAsText(file);
    });
    e.target.value = "";
  };

  const clearAll = () => {
    if (!window.confirm("Очистить все загруженные результаты?")) return;
    setResults([]);
    setSelectedId(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const totalStudents = results.length;
  const passedStudents = results.filter((r) => r.passed).length;
  const avgScore = totalStudents
    ? results.reduce((acc, curr) => acc + curr.score, 0) / totalStudents
    : 0;
  const passRate = totalStudents
    ? Math.round((passedStudents / totalStudents) * 100)
    : 0;

  const median = useMemo(() => {
    if (!totalStudents) return 0;
    const sorted = [...results].map((r) => r.score).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }, [results, totalStudents]);

  const best = useMemo(
    () =>
      totalStudents
        ? results.reduce((a, b) => (b.score > a.score ? b : a))
        : null,
    [results, totalStudents],
  );
  const worst = useMemo(
    () =>
      totalStudents
        ? results.reduce((a, b) => (b.score < a.score ? b : a))
        : null,
    [results, totalStudents],
  );

  const distribution = useMemo(() => {
    const buckets = [
      { label: "0–20%", min: 0, max: 20, count: 0 },
      { label: "20–40%", min: 20, max: 40, count: 0 },
      { label: "40–60%", min: 40, max: 60, count: 0 },
      { label: "60–80%", min: 60, max: 80, count: 0 },
      { label: "80–100%", min: 80, max: 101, count: 0 },
    ];
    results.forEach((r) => {
      const pct = r.maxScore ? (r.score / r.maxScore) * 100 : 0;
      const bucket =
        buckets.find((b) => pct >= b.min && pct < b.max) ||
        buckets[buckets.length - 1];
      bucket.count += 1;
    });
    return buckets;
  }, [results]);
  const maxBucket = Math.max(1, ...distribution.map((b) => b.count));

  const questionStats = useMemo(() => {
    const map = new Map();
    results.forEach((r) => {
      (r.details || []).forEach((det) => {
        if (!map.has(det.question)) {
          map.set(det.question, {
            question: det.question,
            total: 0,
            correct: 0,
          });
        }
        const entry = map.get(det.question);
        entry.total += 1;
        if (det.isCorrect) entry.correct += 1;
      });
    });
    return Array.from(map.values())
      .map((e) => ({
        ...e,
        rate: e.total ? Math.round((e.correct / e.total) * 100) : 0,
      }))
      .sort((a, b) => a.rate - b.rate);
  }, [results]);

  const filteredResults = useMemo(() => {
    return results
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
  }, [results, search, statusFilter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const rankOf = (id) => {
    const sorted = [...results].sort((a, b) => b.score - a.score);
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
      {/* Зона загрузки */}
      <div
        className="card"
        style={{
          border: "2px dashed var(--border)",
          textAlign: "center",
          position: "relative",
          cursor: "pointer",
          transition: "all 0.2s",
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
          }}
        />
        <UploadCloud
          size={40}
          style={{ color: "var(--text-muted)", margin: "0 auto 12px" }}
        />
        <h3
          style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}
        >
          Загрузите файлы результатов (.json)
        </h3>
        <p className="text-muted">
          Перетащите файлы сюда или нажмите для выбора
        </p>
      </div>

      {notice && (
        <div
          style={{
            background: "var(--danger-bg)",
            color: "var(--danger)",
            padding: "12px 16px",
            borderRadius: "10px",
            marginBottom: "24px",
            fontWeight: "500",
            fontSize: "14px",
          }}
        >
          {notice}
        </div>
      )}

      {totalStudents > 0 && (
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
              value={best?.score}
              label={`Лучший: ${best?.fio?.split(" ")[0] || "—"}`}
              color="#d97706"
            />
          </div>

          {/* Графики */}
          {totalStudents > 1 && (
            <div className="grid-2" style={{ marginBottom: "24px" }}>
              <div className="card" style={{ marginBottom: 0 }}>
                <h3
                  className="text-muted"
                  style={{
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "16px",
                    fontWeight: "600",
                  }}
                >
                  Распределение результатов
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {distribution.map((b) => (
                    <div
                      key={b.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <span
                        className="text-muted"
                        style={{
                          fontSize: "13px",
                          width: "60px",
                          flexShrink: 0,
                        }}
                      >
                        {b.label}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: "8px",
                          background: "var(--border)",
                          borderRadius: "10px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${(b.count / maxBucket) * 100}%`,
                            background: "var(--primary)",
                            height: "100%",
                            borderRadius: "10px",
                            transition: "width 0.5s",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          width: "20px",
                          textAlign: "right",
                        }}
                      >
                        {b.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ marginBottom: 0 }}>
                <h3
                  className="text-muted"
                  style={{
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "16px",
                    fontWeight: "600",
                  }}
                >
                  Сложность вопросов (верные ответы)
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    maxHeight: "200px",
                    overflowY: "auto",
                    paddingRight: "8px",
                  }}
                >
                  {questionStats.map((q, idx) => (
                    <div key={idx}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "13px",
                          marginBottom: "6px",
                          gap: "12px",
                        }}
                      >
                        <span
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {q.question}
                        </span>
                        <span
                          style={{
                            fontWeight: "600",
                            color:
                              q.rate < 50 ? "var(--danger)" : "var(--success)",
                          }}
                        >
                          {q.rate}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: "6px",
                          background: "var(--border)",
                          borderRadius: "10px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${q.rate}%`,
                            background:
                              q.rate < 50 ? "var(--danger)" : "var(--success)",
                            height: "100%",
                            borderRadius: "10px",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Нижняя часть: Таблица и Детали */}
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
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
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
                  <button
                    onClick={clearAll}
                    className="btn-icon"
                    title="Очистить всё"
                    style={{ marginLeft: "4px" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "var(--text-muted)",
                          }}
                        >
                          ФИО <ArrowUpDown size={14} />
                        </button>
                      </th>
                      <th style={{ padding: "12px 20px" }}>
                        <button
                          onClick={() => toggleSort("score")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "var(--text-muted)",
                          }}
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
                        onMouseOver={(e) => {
                          if (selectedId !== res._id)
                            e.currentTarget.style.background = "#f9fafb";
                        }}
                        onMouseOut={(e) => {
                          if (selectedId !== res._id)
                            e.currentTarget.style.background = "white";
                        }}
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
                              alignItems: "center",
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
                      </tr>
                    ))}
                    {filteredResults.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
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
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <button
                    onClick={goPrev}
                    disabled={selectedIndexInList <= 0}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary)",
                      cursor: selectedIndexInList <= 0 ? "default" : "pointer",
                      opacity: selectedIndexInList <= 0 ? 0.3 : 1,
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    ← Пред.
                  </button>
                  <span className="text-muted" style={{ fontSize: "12px" }}>
                    {selectedIndexInList + 1} из {filteredResults.length}
                  </span>
                  <button
                    onClick={goNext}
                    disabled={selectedIndexInList >= filteredResults.length - 1}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary)",
                      cursor:
                        selectedIndexInList >= filteredResults.length - 1
                          ? "default"
                          : "pointer",
                      opacity:
                        selectedIndexInList >= filteredResults.length - 1
                          ? 0.3
                          : 1,
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
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
      {value !== null && value !== undefined && (
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
      )}
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
