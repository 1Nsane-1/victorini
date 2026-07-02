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
  const [statusFilter, setStatusFilter] = useState("all"); // all | passed | failed
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
                `Достигнут лимит ${MAX_RESULTS} сохранённых результатов — старые записи удалены.`,
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
    if (!confirm("Очистить все загруженные результаты?")) return;
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

  // Распределение баллов по процентным диапазонам
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

  // Сложность вопросов — агрегируем по всем сданным работам
  const questionStats = useMemo(() => {
    const map = new Map();
    results.forEach((r) => {
      (r.details || []).forEach((det) => {
        if (!map.has(det.question)) {
          map.set(det.question, {
            question: det.question,
            total: 0,
            correct: 0,
            wrongCounts: {},
          });
        }
        const entry = map.get(det.question);
        entry.total += 1;
        if (det.isCorrect) {
          entry.correct += 1;
        } else {
          (det.userAnswers || []).forEach((idx) => {
            entry.wrongCounts[idx] = (entry.wrongCounts[idx] || 0) + 1;
          });
        }
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
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
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
    ) {
      setSelectedId(filteredResults[selectedIndexInList + 1]._id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Зона загрузки */}
      <div className="paper-card border-dashed p-8 md:p-10 text-center mb-6 relative hover:border-[var(--navy)] transition-colors">
        <input
          type="file"
          multiple
          accept=".json"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <UploadCloud
          className="mx-auto text-[var(--graphite)] mb-3"
          size={40}
        />
        <h3 className="font-mono text-sm uppercase tracking-wider text-[var(--ink)]">
          Загрузите файлы результатов (.json)
        </h3>
        <p className="text-[var(--ink-soft)] mt-1 text-sm">
          Перетащите файлы сюда или нажмите для выбора
        </p>
      </div>

      {totalStudents > 0 && (
        <div className="flex items-center justify-between mb-4 font-mono text-xs text-[var(--graphite)] uppercase tracking-wider">
          <span>
            Сохранено: {totalStudents}/{MAX_RESULTS}
          </span>
          <span>Результаты хранятся локально в этом браузере</span>
        </div>
      )}

      {notice && (
        <div className="paper-card mb-4 px-4 py-3 text-sm text-[var(--amber)] border-[var(--amber)] bg-[var(--amber-soft)] animate-fade-in">
          {notice}
        </div>
      )}

      {totalStudents > 1 && (
        <>
          {/* Сводная статистика */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<Users size={22} />}
              value={totalStudents}
              label="Сдавших"
            />
            <StatCard
              icon={<CheckCircle size={22} />}
              value={passedStudents}
              label="Успешно"
              tone="correct"
            />
            <StatCard
              icon={<XCircle size={22} />}
              value={totalStudents - passedStudents}
              label="Провалили"
              tone="incorrect"
            />
            <StatCard
              icon={
                <span className="font-mono font-bold text-lg">{passRate}%</span>
              }
              value={null}
              label="Процент сдачи"
              tone="navy"
            />
            <StatCard value={avgScore.toFixed(1)} label="Средний балл" />
            <StatCard value={median} label="Медиана" />
            <StatCard
              icon={<Crown size={20} className="text-[var(--amber)]" />}
              value={best?.score}
              label={`Лучший: ${best?.fio?.split(" ")[0] || "—"}`}
            />
            <StatCard
              icon={
                <TrendingDown size={20} className="text-[var(--incorrect)]" />
              }
              value={worst?.score}
              label={`Худший: ${worst?.fio?.split(" ")[0] || "—"}`}
            />
          </div>

          {/* Распределение баллов + сложность вопросов */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="paper-card p-6">
              <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--graphite)] mb-5">
                Распределение результатов
              </h3>
              <div className="space-y-3">
                {distribution.map((b) => (
                  <div key={b.label} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[var(--ink-soft)] w-16 shrink-0">
                      {b.label}
                    </span>
                    <div className="bar-track flex-1">
                      <div
                        className="bar-fill animate-grow-bar"
                        style={{
                          width: `${(b.count / maxBucket) * 100}%`,
                          background: "var(--navy)",
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs text-[var(--ink)] w-6 text-right shrink-0">
                      {b.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="paper-card p-6">
              <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--graphite)] mb-5">
                Сложность вопросов
              </h3>
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2">
                {questionStats.map((q, idx) => (
                  <div key={idx}>
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <p className="text-sm text-[var(--ink)] leading-snug flex-1">
                        {q.question}
                      </p>
                      <span
                        className={`font-mono text-xs font-semibold shrink-0 ${
                          q.rate < 50
                            ? "text-[var(--incorrect)]"
                            : "text-[var(--correct)]"
                        }`}
                      >
                        {q.rate}%
                      </span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill animate-grow-bar"
                        style={{
                          width: `${q.rate}%`,
                          background:
                            q.rate < 50 ? "var(--incorrect)" : "var(--correct)",
                        }}
                      />
                    </div>
                  </div>
                ))}
                {questionStats.length === 0 && (
                  <p className="text-sm text-[var(--graphite)] font-mono">
                    Нет данных
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {totalStudents >= 1 && (
        <>
          {/* Таблица результатов + детали */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 paper-card overflow-hidden">
              <div className="p-4 border-b border-[var(--line)] flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-xs">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--graphite)]"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск по ФИО..."
                    className="w-full pl-9 pr-3 py-2 border border-[var(--line-strong)] rounded-lg bg-[var(--paper)] text-sm font-mono focus:outline-none focus:border-[var(--navy)]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <FilterPill
                    active={statusFilter === "all"}
                    onClick={() => setStatusFilter("all")}
                  >
                    Все
                  </FilterPill>
                  <FilterPill
                    active={statusFilter === "passed"}
                    onClick={() => setStatusFilter("passed")}
                    tone="correct"
                  >
                    Сдали
                  </FilterPill>
                  <FilterPill
                    active={statusFilter === "failed"}
                    onClick={() => setStatusFilter("failed")}
                    tone="incorrect"
                  >
                    Не сдали
                  </FilterPill>
                  <button
                    onClick={clearAll}
                    title="Очистить все результаты"
                    className="ml-1 p-2 text-[var(--graphite)] hover:text-[var(--incorrect)] transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <table className="w-full text-left">
                <thead className="bg-[var(--paper)] text-[var(--graphite)] font-mono text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4 font-semibold">
                      <button
                        onClick={() => toggleSort("name")}
                        className="flex items-center gap-1 hover:text-[var(--navy)]"
                      >
                        ФИО <ArrowUpDown size={12} />
                      </button>
                    </th>
                    <th className="p-4 font-semibold">
                      <button
                        onClick={() => toggleSort("score")}
                        className="flex items-center gap-1 hover:text-[var(--navy)]"
                      >
                        Балл <ArrowUpDown size={12} />
                      </button>
                    </th>
                    <th className="p-4 font-semibold">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((res) => (
                    <tr
                      key={res._id}
                      onClick={() => setSelectedId(res._id)}
                      className={`ruled-row cursor-pointer hover:bg-[var(--navy-soft)] transition-colors ${
                        selectedId === res._id ? "bg-[var(--navy-soft)]" : ""
                      }`}
                    >
                      <td className="p-4 font-medium text-[var(--ink)] flex items-center gap-2">
                        {best && res.fio === best.fio && (
                          <Crown
                            size={14}
                            className="text-[var(--amber)] shrink-0"
                          />
                        )}
                        {res.fio}
                      </td>
                      <td className="p-4 font-mono">
                        {res.score} / {res.maxScore}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wide ${
                            res.passed
                              ? "bg-[var(--correct-soft)] text-[var(--correct)]"
                              : "bg-[var(--incorrect-soft)] text-[var(--incorrect)]"
                          }`}
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
                        className="p-6 text-center text-[var(--graphite)] font-mono text-sm"
                      >
                        Ничего не найдено
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Детальный просмотр */}
            {selectedStudent && (
              <div className="flex-1 paper-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={goPrev}
                    disabled={selectedIndexInList <= 0}
                    className="font-mono text-xs uppercase tracking-wider text-[var(--graphite)] hover:text-[var(--navy)] disabled:opacity-30 disabled:hover:text-[var(--graphite)] transition-colors"
                  >
                    ← Пред.
                  </button>
                  <span className="font-mono text-[11px] text-[var(--graphite)]">
                    {selectedIndexInList + 1} / {filteredResults.length}
                  </span>
                  <button
                    onClick={goNext}
                    disabled={selectedIndexInList >= filteredResults.length - 1}
                    className="font-mono text-xs uppercase tracking-wider text-[var(--graphite)] hover:text-[var(--navy)] disabled:opacity-30 disabled:hover:text-[var(--graphite)] transition-colors"
                  >
                    След. →
                  </button>
                </div>
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--ink)]">
                      {selectedStudent.fio}
                    </h3>
                    <p className="font-mono text-xs text-[var(--graphite)] mt-1">
                      Место {rankOf(selectedStudent._id)} из {totalStudents}
                      {totalStudents > 1 && (
                        <>
                          {" "}
                          ·{" "}
                          {selectedStudent.score > avgScore ? (
                            <span className="text-[var(--correct)] inline-flex items-center gap-1">
                              <TrendingUp size={12} /> выше среднего
                            </span>
                          ) : selectedStudent.score < avgScore ? (
                            <span className="text-[var(--incorrect)] inline-flex items-center gap-1">
                              <TrendingDown size={12} /> ниже среднего
                            </span>
                          ) : (
                            <span className="text-[var(--ink-soft)]">
                              на уровне среднего
                            </span>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  <span
                    className={`stamp text-sm ${
                      selectedStudent.passed
                        ? "text-[var(--correct)]"
                        : "text-[var(--incorrect)]"
                    }`}
                  >
                    {selectedStudent.score}/{selectedStudent.maxScore}
                  </span>
                </div>

                {/* сравнение со средним */}
                {totalStudents > 1 && (
                  <div className="mb-5">
                    <div className="flex justify-between font-mono text-[11px] text-[var(--graphite)] mb-1">
                      <span>Результат</span>
                      <span>Средний балл: {avgScore.toFixed(1)}</span>
                    </div>
                    <div className="bar-track h-2.5 relative">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${(selectedStudent.score / selectedStudent.maxScore) * 100}%`,
                          background: selectedStudent.passed
                            ? "var(--correct)"
                            : "var(--incorrect)",
                        }}
                      />
                      {selectedStudent.maxScore > 0 && (
                        <div
                          className="absolute top-[-3px] w-[2px] h-[14px] bg-[var(--ink)]"
                          style={{
                            left: `${(avgScore / selectedStudent.maxScore) * 100}%`,
                          }}
                          title="Средний балл группы"
                        />
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                  {selectedStudent.details.map((det, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-l-4 ${
                        det.isCorrect
                          ? "border-[var(--correct)] bg-[var(--correct-soft)]"
                          : "border-[var(--incorrect)] bg-[var(--incorrect-soft)]"
                      }`}
                    >
                      <p className="font-semibold text-[var(--ink)] mb-2 text-sm">
                        {idx + 1}. {det.question}
                      </p>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span
                          className={
                            det.isCorrect
                              ? "text-[var(--correct)] font-medium"
                              : "text-[var(--incorrect)] font-medium"
                          }
                        >
                          {det.isCorrect ? "✓ Верно" : "✗ Ошибка"}
                        </span>
                        {!det.isCorrect && (
                          <span className="text-[var(--ink-soft)]">
                            выбрано:{" "}
                            {det.userAnswers
                              .map((i) => letterFor(i))
                              .join(", ") || "—"}{" "}
                            · верно:{" "}
                            {det.correctAnswers
                              .map((i) => letterFor(i))
                              .join(", ")}
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

function StatCard({ icon, value, label, tone }) {
  const toneColor =
    tone === "correct"
      ? "var(--correct)"
      : tone === "incorrect"
        ? "var(--incorrect)"
        : tone === "navy"
          ? "var(--navy)"
          : "var(--ink)";
  return (
    <div className="paper-card p-5 flex flex-col items-center justify-center text-center gap-1.5">
      {icon && <div style={{ color: toneColor }}>{icon}</div>}
      {value !== null && value !== undefined && (
        <div
          className="text-2xl font-bold font-mono"
          style={{ color: toneColor }}
        >
          {value}
        </div>
      )}
      <div className="text-xs font-mono uppercase tracking-wide text-[var(--graphite)]">
        {label}
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, children, tone }) {
  const activeBg =
    tone === "correct"
      ? "bg-[var(--correct-soft)] text-[var(--correct)] border-[var(--correct)]"
      : tone === "incorrect"
        ? "bg-[var(--incorrect-soft)] text-[var(--incorrect)] border-[var(--incorrect)]"
        : "bg-[var(--navy-soft)] text-[var(--navy)] border-[var(--navy)]";
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-colors ${
        active
          ? activeBg
          : "border-[var(--line-strong)] text-[var(--graphite)] hover:bg-[var(--paper)]"
      }`}
    >
      {children}
    </button>
  );
}
