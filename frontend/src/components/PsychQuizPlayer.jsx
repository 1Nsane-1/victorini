import React, { useState, useEffect } from "react";
import { psychQuestions } from "./psychQuestions";

export default function PsychQuizPlayer() {
  // --- СОСТОЯНИЯ ---
  const [step, setStep] = useState(0);
  const [folders, setFolders] = useState([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);
  const [studentInfo, setStudentInfo] = useState({
    fullName: "",
    gender: "Мужской",
    folderId: "",
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPsychFolders = async () => {
      try {
        const response = await fetch("/api/psych-test/folders");
        if (!response.ok) throw new Error("Сетевая ошибка при загрузке папок");
        const loadedFolders = await response.json();
        setFolders(loadedFolders);
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

  const handleChange = (e) => {
    setStudentInfo({ ...studentInfo, [e.target.name]: e.target.value });
  };

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
    setStep(1);
  };

  const handleAnswerSelect = async (score) => {
    const currentQuestion = psychQuestions[currentQuestionIndex];
    const newAnswers = { ...answers, [currentQuestion.id]: score };
    setAnswers(newAnswers);

    if (currentQuestionIndex < psychQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      await submitResults(newAnswers);
    }
  };

  const submitResults = async (finalAnswers) => {
    setIsSubmitting(true);
    setError("");
    try {
      const payload = {
        student: {
          fullName: studentInfo.fullName,
          gender: studentInfo.gender,
        },
        folderId: studentInfo.folderId,
        answers: finalAnswers,
      };

      const response = await fetch("/api/psych-test/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Ошибка сервера при сохранении");
      setStep(2);
    } catch (err) {
      console.error("Ошибка при отправке результатов:", err);
      setError(
        "Произошла ошибка при сохранении результатов. Пожалуйста, не закрывайте страницу и позовите преподавателя.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-10 p-6 bg-white rounded-xl shadow-md border border-gray-100">
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ФИО студента *
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Папка для сохранения результатов *
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
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                Начать прохождение
              </button>
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div>
          <div className="flex justify-between items-center mb-3 text-sm text-gray-500">
            <span className="font-medium text-blue-600">
              Вопрос {currentQuestionIndex + 1} из {psychQuestions.length}
            </span>
            <span>
              В папку:{" "}
              {folders.find((f) => f._id === studentInfo.folderId)?.name}
            </span>
          </div>
          <div className="w-full bg-gray-200 h-2.5 rounded-full mb-8 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / psychQuestions.length) * 100}%`,
              }}
            />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-8 min-h-[4rem]">
            {psychQuestions[currentQuestionIndex].text}
          </h3>
          <div className="space-y-3 relative">
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
                className="w-full text-left px-5 py-4 border rounded-xl border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition text-gray-700 font-medium"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

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
            . Ваши ответы отправлены.
          </p>
        </div>
      )}
    </div>
  );
}
