import React, { useState } from "react";
import { generateTestHTML } from "../testTemplate";
import { PlusCircle, Trash2, Download } from "lucide-react";

const letterFor = (i) => String.fromCharCode(65 + i);

export default function Constructor() {
  const [settings, setSettings] = useState({
    title: "Новый тест",
    pointsPerQuestion: 1,
    passScore: 50,
  });
  const [questions, setQuestions] = useState([]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: "", type: "radio", options: [""], correctAnswers: [] },
    ]);
  };

  const updateQuestion = (index, field, value) => {
    const newQ = [...questions];
    newQ[index][field] = value;
    setQuestions(newQ);
  };

  const addOption = (qIndex) => {
    const newQ = [...questions];
    newQ[qIndex].options.push("");
    setQuestions(newQ);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const newQ = [...questions];
    newQ[qIndex].options[oIndex] = value;
    setQuestions(newQ);
  };

  const removeOption = (qIndex, oIndex) => {
    const newQ = [...questions];
    newQ[qIndex].options.splice(oIndex, 1);
    newQ[qIndex].correctAnswers = newQ[qIndex].correctAnswers.filter(
      (ans) => ans !== oIndex,
    );
    setQuestions(newQ);
  };

  const toggleCorrectAnswer = (qIndex, oIndex) => {
    const newQ = [...questions];
    const q = newQ[qIndex];
    if (q.type === "radio") {
      q.correctAnswers = [oIndex];
    } else {
      if (q.correctAnswers.includes(oIndex)) {
        q.correctAnswers = q.correctAnswers.filter((ans) => ans !== oIndex);
      } else {
        q.correctAnswers.push(oIndex);
      }
    }
    setQuestions(newQ);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleGenerate = () => {
    if (questions.length === 0) return alert("Добавьте хотя бы один вопрос");

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text)
        return alert(`Вопрос ${i + 1} не содержит текста`);
      if (questions[i].correctAnswers.length === 0)
        return alert(`Вопрос ${i + 1} не имеет правильного ответа`);
    }

    const quizData = { ...settings, questions };
    const htmlContent = generateTestHTML(quizData);

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "test.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPossible =
    questions.length * (Number(settings.pointsPerQuestion) || 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Заголовок-бланк */}
      <div className="paper-card p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--graphite)]">
            Бланк теста
          </h2>
          <span className="font-mono text-xs text-[var(--graphite)]">
            {questions.length} {questions.length === 1 ? "вопрос" : "вопросов"}{" "}
            · до {totalPossible} баллов
          </span>
        </div>

        <div>
          <label className="block font-mono text-[11px] uppercase tracking-wider text-[var(--graphite)] mb-2">
            Название теста
          </label>
          <input
            type="text"
            value={settings.title}
            onChange={(e) =>
              setSettings({ ...settings, title: e.target.value })
            }
            className="field-underline w-full text-2xl font-semibold text-[var(--ink)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6 max-w-sm">
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-[var(--graphite)] mb-2">
              Баллов за вопрос
            </label>
            <input
              type="number"
              value={settings.pointsPerQuestion}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  pointsPerQuestion: Number(e.target.value),
                })
              }
              className="field-underline w-full text-lg"
            />
          </div>
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-[var(--graphite)] mb-2">
              Проходной балл
            </label>
            <input
              type="number"
              value={settings.passScore}
              onChange={(e) =>
                setSettings({ ...settings, passScore: Number(e.target.value) })
              }
              className="field-underline w-full text-lg"
            />
          </div>
        </div>
      </div>

      {/* Вопросы */}
      <div className="space-y-4">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="paper-card flex overflow-hidden">
            <div className="timing-track" />
            <div className="flex-1 p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="q-badge">{qIndex + 1}</div>
                <div className="flex-1 flex flex-col md:flex-row gap-4">
                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) =>
                      updateQuestion(qIndex, "text", e.target.value)
                    }
                    placeholder="Текст вопроса..."
                    className="field-underline flex-1 text-base font-medium"
                  />
                  <select
                    value={q.type}
                    onChange={(e) => {
                      updateQuestion(qIndex, "type", e.target.value);
                      updateQuestion(qIndex, "correctAnswers", []);
                    }}
                    className="border border-[var(--line-strong)] rounded-lg px-3 py-2 bg-[var(--paper)] font-mono text-sm text-[var(--ink-soft)] md:w-56"
                  >
                    <option value="radio">Один правильный</option>
                    <option value="checkbox">Несколько правильных</option>
                  </select>
                </div>
                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="text-[var(--graphite)] hover:text-[var(--incorrect)] transition-colors"
                  title="Удалить вопрос"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-2.5 pl-1">
                {q.options.map((opt, oIndex) => {
                  const marked = q.correctAnswers.includes(oIndex);
                  return (
                    <div key={oIndex} className="flex items-center gap-3 group">
                      <button
                        type="button"
                        onClick={() => toggleCorrectAnswer(qIndex, oIndex)}
                        className={`bubble ${q.type === "checkbox" ? "checkbox-shape" : ""} ${marked ? "is-marked" : ""}`}
                        title="Отметить как правильный"
                      >
                        {letterFor(oIndex)}
                      </button>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) =>
                          updateOption(qIndex, oIndex, e.target.value)
                        }
                        placeholder={`Вариант ${letterFor(oIndex)}`}
                        className="field-underline flex-1"
                      />
                      <button
                        onClick={() => removeOption(qIndex, oIndex)}
                        className="text-[var(--line-strong)] hover:text-[var(--incorrect)] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => addOption(qIndex)}
                  className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[var(--navy)] hover:underline mt-3 ml-[42px]"
                >
                  <PlusCircle size={14} /> Добавить вариант
                </button>
              </div>
            </div>
          </div>
        ))}

        {questions.length === 0 && (
          <div className="paper-card border-dashed p-10 text-center text-[var(--graphite)] font-mono text-sm">
            Пока нет ни одного вопроса — начните с кнопки ниже
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pb-12">
        <button
          onClick={addQuestion}
          className="flex-1 border-2 border-dashed border-[var(--line-strong)] text-[var(--ink-soft)] py-3.5 rounded-xl font-mono text-sm uppercase tracking-wider hover:border-[var(--navy)] hover:text-[var(--navy)] transition flex justify-center items-center gap-2"
        >
          <PlusCircle size={18} /> Добавить вопрос
        </button>
        <button
          onClick={handleGenerate}
          className="flex-1 bg-[var(--navy)] text-white py-3.5 rounded-xl font-mono text-sm uppercase tracking-wider hover:bg-[var(--navy-ink)] transition flex justify-center items-center gap-2 shadow-sm"
        >
          <Download size={18} /> Сгенерировать test.html
        </button>
      </div>
    </div>
  );
}
