import React, { useState } from "react";

// Моковые данные вопросов (первые несколько из файла)
const mockQuestions = [
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
  // Состояния, аналогичные Анализатору
  const [folders, setFolders] = useState([
    { id: 1, name: "Папка 1 (Основная)" },
    { id: 2, name: "Группа 101-А" },
  ]);
  const [activeFolderId, setActiveFolderId] = useState(1);
  const [activeStudentId, setActiveStudentId] = useState(null);

  // Обработчик копирования ссылки
  const handleCopyLink = () => {
    const testUrl = `${window.location.origin}/take-psych-test`;
    navigator.clipboard.writeText(testUrl);
    alert("Ссылка на прохождение теста скопирована в буфер обмена!");
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* ЛЕВАЯ КОЛОНКА: Папки и результаты */}
      <div className="w-1/4 bg-white border-r flex flex-col">
        <div className="p-4 border-b bg-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Результаты СПТ</h2>
        </div>

        {/* Список папок */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Папки
            </h3>
            <button className="text-blue-600 text-sm hover:underline">
              + Новая
            </button>
          </div>

          <ul className="space-y-2 mb-6">
            {folders.map((folder) => (
              <li
                key={folder.id}
                onClick={() => setActiveFolderId(folder.id)}
                className={`p-2 rounded cursor-pointer transition-colors ${
                  activeFolderId === folder.id
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                📁 {folder.name}
              </li>
            ))}
          </ul>

          {/* Список студентов в активной папке (пока мок) */}
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Студенты
          </h3>
          <ul className="space-y-2">
            <li className="p-2 border rounded hover:border-blue-400 cursor-pointer text-sm text-gray-700">
              <div className="font-medium">Иванов И. И.</div>
              <div className="text-xs text-gray-500">18.08.2026 • Пройден</div>
            </li>
            <li className="p-2 border rounded hover:border-blue-400 cursor-pointer text-sm text-gray-700">
              <div className="font-medium text-red-600">Петров П. П.</div>
              <div className="text-xs text-gray-500">
                17.08.2026 • Недостоверно (Ложь)
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* ПРАВАЯ КОЛОНКА: Основная рабочая область */}
      <div className="w-3/4 flex flex-col bg-gray-50">
        {/* Хедер рабочей области */}
        <div className="p-6 border-b bg-white flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Структура теста (Big Five)
            </h1>
            <p className="text-sm text-gray-500 mt-1">Всего вопросов: 111</p>
          </div>
          <button
            onClick={handleCopyLink}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded shadow transition-colors"
          >
            🔗 Сгенерировать ссылку
          </button>
        </div>

        {/* Контент: Список вопросов (если студент не выбран) */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="bg-white rounded shadow p-6">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">
              Содержание методики
            </h3>

            <div className="space-y-4">
              {mockQuestions.map((q) => (
                <div
                  key={q.id}
                  className="flex p-3 bg-gray-50 rounded border border-gray-100 items-start"
                >
                  <div className="w-8 font-bold text-gray-400">{q.id}.</div>
                  <div className="flex-1 text-gray-800">{q.text}</div>
                  <div className="flex space-x-2 text-xs">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {q.scale}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full ${
                        q.type === "Прямой"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {q.type}
                    </span>
                  </div>
                </div>
              ))}

              <div className="text-center text-gray-400 pt-4 text-sm">
                ... (еще 106 вопросов) ...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PsychTestTab;
