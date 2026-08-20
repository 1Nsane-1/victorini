import React, { useState, useEffect } from "react";
import axios from "axios";
// Импортируй свои вопросы. Если они приходят с бэка, логику тоже можно вынести в useEffect
import { psychQuestions } from "./psychQuestions";

export default function PsychQuizPlayer() {
  // --- СОСТОЯНИЯ ---
  // Шаги: 0 - Форма старта, 1 - Прохождение теста, 2 - Успешное завершение
  const [step, setStep] = useState(0);

  // Состояния для папок
  const [folders, setFolders] = useState([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);

  // Данные студента
  const [studentInfo, setStudentInfo] = useState({
    fullName: "",
    gender: "Мужской",
    folderId: "",
  });

  // Состояния прохождения теста
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. ЗАГРУЗКА ПАПОК ПСИХ. ТЕСТА ПРИ МОНТИРОВАНИИ ---
  useEffect(() => {
    const fetchPsychFolders = async () => {
      try {
        // Укажи здесь СВОЙ эндпоинт, который отдает папки именно Псих. теста
        const response = await axios.get("/api/psych-test/folders");

        const loadedFolders = response.data;
        setFolders(loadedFolders);

        // Если папки есть, автоматически выбираем первую в селекте
        if (loadedFolders.length > 0) {
          setStudentInfo((prev) => ({
            ...prev,
            folderId: loadedFolders[0]._id,
          }));
        }
      } catch (err) {
        console.error("Ошибка при загрузке папок псих. теста:", err);
        setError(
          "Не удалось загрузить список папок. Обратитесь к преподавателю.",
        );
      } finally {
        setIsLoadingFolders(false);
      }
    };

    fetchPsychFolders();
  }, []);

  // --- ОБРАБОТЧИКИ ---
  // Ввод текста/выбор в форме
  const handleChange = (e) => {
    setStudentInfo({ ...studentInfo, [e.target.name]: e.target.value });
  };

  // Проверка формы и переход к тесту
  const handleStart = () => {
    if (!studentInfo.fullName.trim()) {
      setError("Пожалуйста, введите ФИО");
      return;
    }
    if (!studentInfo.folderId) {
      setError("Пожалуйста, выберите папку для сохранения");
      return;
    }
    setError("");
    setStep(1); // Переходим к вопросам
  };

  // Выбор ответа на вопрос
  const handleAnswerSelect = async (score) => {
    const currentQuestion = psychQuestions[currentQuestionIndex];

    // Сохраняем ответ (можно сохранять как score, так и объект с текстом вопроса)
    const newAnswers = { ...answers, [currentQuestion.id]: score };
    setAnswers(newAnswers);

    if (currentQuestionIndex < psychQuestions.length - 1) {
      // Если вопросы еще есть - идем к следующему
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Если вопрос последний - отправляем результаты
      await submitResults(newAnswers);
    }
  };

  // Отправка результатов на бэкенд
  const submitResults = async (finalAnswers) => {
    setIsSubmitting(true);
    setError("");
    try {
      const payload = {
        student: {
          fullName: studentInfo.fullName,
          gender: studentInfo.gender,
        },
        folderId: studentInfo.folderId, // Привязываем к выбранной папке псих. теста
        answers: finalAnswers,
      };

      // Укажи здесь СВОЙ эндпоинт для сохранения результатов псих. теста
      await axios.post("/api/psych-test/results", payload);

      setStep(2); // Переходим к экрану "Успешно"
    } catch (err) {
      console.error("Ошибка при отправке результатов:", err);
      setError(
        "Произошла ошибка при сохранении результатов. Пожалуйста, не закрывайте страницу и позовите преподавателя.",
      );
      // Оставляем на последнем вопросе, чтобы студент мог попробовать отправить еще раз
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- РЕНДЕР ---
  return (
    <div className="max-w-xl mx-auto my-10 p-6 bg-white rounded-xl shadow-md border border-gray-100">
      {/* Вывод глобальных ошибок (например, при загрузке или отправке) */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* ================= ШАГ 0: ФОРМА СТАРТА ================= */}
      {step === 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Психологический тест
          </h2>

          {isLoadingFolders ? (
            <div className="text-center text-gray-500 py-8 animate-pulse">
              Загрузка доступных папок...
            </div>
          ) : (
            <div className="space-y-5">
              {/* ФИО */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ФИО студента <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Например: Иванов Иван Иванович"
                  value={studentInfo.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none border-gray-300"
                />
              </div>

              {/* Пол */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Пол
                </label>
                <select
                  name="gender"
                  value={studentInfo.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none border-gray-300 bg-white"
                >
                  <option value="Мужской">Мужской</option>
                  <option value="Женский">Женский</option>
                </select>
              </div>

              {/* Выбор папки */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Папка для сохранения результатов{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  name="folderId"
                  value={studentInfo.folderId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none border-gray-300 bg-white"
                >
                  {folders.length === 0 ? (
                    <option value="" disabled>
                      Папки не созданы преподавателем
                    </option>
                  ) : (
                    folders.map((folder) => (
                      // Используем _id, так как в MongoDB уникальные ключи хранятся так
                      <option key={folder._id} value={folder._id}>
                        📁 {folder.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <button
                onClick={handleStart}
                disabled={folders.length === 0}
                className={`w-full mt-2 py-3 text-white font-medium rounded-lg transition ${
                  folders.length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow"
                }`}
              >
                Начать прохождение
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= ШАГ 1: ВОПРОСЫ ТЕСТА ================= */}
      {step === 1 && (
        <div>
          {/* Шапка: прогресс и текущая папка */}
          <div className="flex justify-between items-center mb-3 text-sm text-gray-500">
            <span className="font-medium text-blue-600">
              Вопрос {currentQuestionIndex + 1} из {psychQuestions.length}
            </span>
            <span className="truncate max-w-[50%]" title="Выбранная папка">
              В папку:{" "}
              {folders.find((f) => f._id === studentInfo.folderId)?.name}
            </span>
          </div>

          {/* Прогресс-бар */}
          <div className="w-full bg-gray-200 h-2.5 rounded-full mb-8 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300 ease-out"
              style={{
                width: `${((currentQuestionIndex + 1) / psychQuestions.length) * 100}%`,
              }}
            />
          </div>

          {/* Текст вопроса */}
          <h3 className="text-xl font-semibold text-gray-800 mb-8 min-h-[4rem]">
            {psychQuestions[currentQuestionIndex].text}
          </h3>

          {/* Варианты ответов */}
          <div className="space-y-3 relative">
            {/* Оверлей при отправке последнего вопроса, чтобы не кликали дважды */}
            {isSubmitting && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-lg">
                <span className="font-medium text-blue-600">
                  Сохранение результатов...
                </span>
              </div>
            )}

            {[
              { label: "Совершенно не согласен", score: 1 },
              { label: "Скорее не согласен", score: 2 },
              { label: "Нейтрально / Затрудняюсь ответить", score: 3 },
              { label: "Скорее согласен", score: 4 },
              { label: "Полностью согласен", score: 5 },
            ].map((option) => (
              <button
                key={option.score}
                onClick={() => handleAnswerSelect(option.score)}
                disabled={isSubmitting}
                className="w-full text-left px-5 py-4 border rounded-xl border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition text-gray-700 font-medium active:bg-blue-100 disabled:opacity-50"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ================= ШАГ 2: ЗАВЕРШЕНИЕ ================= */}
      {step === 2 && (
        <div className="text-center py-8">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Тест успешно завершен!
          </h2>
          <p className="text-gray-600 mb-6">
            Спасибо,{" "}
            <span className="font-semibold text-gray-800">
              {studentInfo.fullName}
            </span>
            . Ваши ответы успешно отправлены преподавателю.
          </p>
          <div className="inline-block bg-gray-50 px-4 py-2 rounded-lg text-sm text-gray-500 border border-gray-200">
            Сохранено в папку:{" "}
            <span className="font-medium">
              {folders.find((f) => f._id === studentInfo.folderId)?.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
