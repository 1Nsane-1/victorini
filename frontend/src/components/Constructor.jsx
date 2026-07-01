import React, { useState } from "react";
import { generateTestHTML } from "../testTemplate";
import { PlusCircle, Trash2, Save, Download } from "lucide-react";

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

    // Проверка заполненности
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Настройки теста
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Название теста
            </label>
            <input
              type="text"
              value={settings.title}
              onChange={(e) =>
                setSettings({ ...settings, title: e.target.value })
              }
              className="w-full border p-2 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
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
              className="w-full border p-2 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Проходной балл
            </label>
            <input
              type="number"
              value={settings.passScore}
              onChange={(e) =>
                setSettings({ ...settings, passScore: Number(e.target.value) })
              }
              className="w-full border p-2 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, qIndex) => (
          <div
            key={qIndex}
            className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-blue-500 relative transition-all"
          >
            <button
              onClick={() => removeQuestion(qIndex)}
              className="absolute top-4 right-4 text-red-400 hover:text-red-600"
            >
              <Trash2 size={20} />
            </button>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Вопрос {qIndex + 1}
                </label>
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) =>
                    updateQuestion(qIndex, "text", e.target.value)
                  }
                  placeholder="Текст вопроса..."
                  className="w-full border p-2 rounded-lg bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="w-48">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Тип ответа
                </label>
                <select
                  value={q.type}
                  onChange={(e) => {
                    updateQuestion(qIndex, "type", e.target.value);
                    updateQuestion(qIndex, "correctAnswers", []);
                  }}
                  className="w-full border p-2 rounded-lg bg-gray-50"
                >
                  <option value="radio">Один правильный</option>
                  <option value="checkbox">Несколько правильных</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pl-4 border-l-2 border-gray-200">
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} className="flex items-center gap-3">
                  <input
                    type={q.type}
                    name={`q_${qIndex}_correct`}
                    checked={q.correctAnswers.includes(oIndex)}
                    onChange={() => toggleCorrectAnswer(qIndex, oIndex)}
                    className="w-5 h-5 text-blue-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) =>
                      updateOption(qIndex, oIndex, e.target.value)
                    }
                    placeholder={`Вариант ${oIndex + 1}`}
                    className="flex-1 border-b border-gray-300 p-1 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => removeOption(qIndex, oIndex)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addOption(qIndex)}
                className="text-blue-500 text-sm font-medium hover:underline flex items-center gap-1 mt-2"
              >
                <PlusCircle size={16} /> Добавить вариант
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 pb-12">
        <button
          onClick={addQuestion}
          className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition flex justify-center items-center gap-2 shadow-lg"
        >
          <PlusCircle size={20} /> Добавить вопрос
        </button>
        <button
          onClick={handleGenerate}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition flex justify-center items-center gap-2 shadow-lg"
        >
          <Download size={20} /> Сгенерировать test.html
        </button>
      </div>
    </div>
  );
}
