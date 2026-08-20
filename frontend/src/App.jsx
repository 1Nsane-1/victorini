import React, { useState } from "react";
import Constructor from "./components/Constructor";
import Analyzer from "./components/Analyzer";
import QuizPlayer from "./components/QuizPlayer";
import PsychTestTab from "./components/PsychTestTab"; // Вкладка управления псих. тестом
import PsychQuizPlayer from "./PsychQuizPlayer"; // Публичный плеер для студентов
import { LayoutDashboard, FileSpreadsheet, PenTool, Brain } from "lucide-react";
import "./App.css";

function App() {
  // --- ПРОВЕРКА ССЫЛОК ДЛЯ ШЕРИНГА ---
  const path = window.location.pathname;

  // Ссылка на обычный квиз
  if (path.startsWith("/quiz/")) {
    const quizId = path.split("/quiz/")[1];
    return <QuizPlayer quizId={quizId} />;
  }

  // Ссылка на прохождение психологического теста
  if (path.startsWith("/psych-test")) {
    return <PsychQuizPlayer />;
  }
  // ------------------------------------

  const [activeTab, setActiveTab] = useState("constructor");

  return (
    <div className="app-layout">
      <header className="header">
        <div className="header-container">
          <div className="logo-section">
            <div className="logo-icon">
              <PenTool size={20} />
            </div>
            <div className="logo-text">
              <h1>Test Builder</h1>
              <p>Локальный конструктор тестов</p>
            </div>
          </div>

          <nav className="nav-tabs">
            <button
              onClick={() => setActiveTab("constructor")}
              className={`tab-btn ${activeTab === "constructor" ? "active" : ""}`}
            >
              <LayoutDashboard size={18} /> Конструктор
            </button>
            <button
              onClick={() => setActiveTab("analyzer")}
              className={`tab-btn ${activeTab === "analyzer" ? "active" : ""}`}
            >
              <FileSpreadsheet size={18} /> Анализатор
            </button>
            <button
              onClick={() => setActiveTab("psych")}
              className={`tab-btn ${activeTab === "psych" ? "active" : ""}`}
            >
              <Brain size={18} /> Псих. тест
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {activeTab === "constructor" && <Constructor />}
        {activeTab === "analyzer" && <Analyzer />}
        {activeTab === "psych" && <PsychTestTab />}
      </main>
    </div>
  );
}

export default App;
