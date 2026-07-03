import React, { useState } from "react";
import { generateTestHTML } from "../testTemplate";
import { Plus, Trash2, Download } from "lucide-react";

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
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Бланк теста</h2>
          <span className="text-muted">
            {questions.length} вопросов · до {totalPossible} баллов
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">Название теста</label>
          <input
            type="text"
            value={settings.title}
            onChange={(e) =>
              setSettings({ ...settings, title: e.target.value })
            }
            className="input-field title-input"
          />
        </div>

        <div className="grid-2">
          <div className="form-group mb-0">
            <label className="form-label">Баллов за вопрос</label>
            <input
              type="number"
              value={settings.pointsPerQuestion}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  pointsPerQuestion: Number(e.target.value),
                })
              }
              className="input-field"
            />
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Проходной балл</label>
            <input
              type="number"
              value={settings.passScore}
              onChange={(e) =>
                setSettings({ ...settings, passScore: Number(e.target.value) })
              }
              className="input-field"
            />
          </div>
        </div>
      </div>

      {questions.map((q, qIndex) => (
        <div key={qIndex} className="card">
          <div className="question-row">
            <div className="q-number">{qIndex + 1}</div>
            <div className="q-content">
              <div className="q-header">
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) =>
                    updateQuestion(qIndex, "text", e.target.value)
                  }
                  placeholder="Текст вопроса..."
                  className="input-field"
                />
                <select
                  value={q.type}
                  onChange={(e) => {
                    updateQuestion(qIndex, "type", e.target.value);
                    updateQuestion(qIndex, "correctAnswers", []);
                  }}
                  className="input-field"
                  style={{ width: "220px" }}
                >
                  <option value="radio">Один правильный</option>
                  <option value="checkbox">Несколько правильных</option>
                </select>
                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="btn-icon"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div>
                {q.options.map((opt, oIndex) => {
                  const marked = q.correctAnswers.includes(oIndex);
                  return (
                    <div key={oIndex} className="option-row">
                      <button
                        type="button"
                        onClick={() => toggleCorrectAnswer(qIndex, oIndex)}
                        className={`bubble ${q.type === "checkbox" ? "checkbox" : ""} ${marked ? "active" : ""}`}
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
                        className="input-field"
                      />
                      <button
                        onClick={() => removeOption(qIndex, oIndex)}
                        className="btn-icon"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => addOption(qIndex)}
                  className="add-option-btn"
                >
                  <Plus size={16} /> Добавить вариант
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {questions.length === 0 && (
        <div
          className="card"
          style={{
            padding: "60px 20px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          Пока нет ни одного вопроса — начните с кнопки ниже
        </div>
      )}

      <div className="actions-row">
        <button onClick={addQuestion} className="btn btn-outline">
          <Plus size={18} /> Добавить вопрос
        </button>
        <button onClick={handleGenerate} className="btn btn-primary">
          <Download size={18} /> Сгенерировать test.html
        </button>
      </div>
    </div>
  );
}
