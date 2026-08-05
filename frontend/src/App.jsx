import React, { useState } from "react";
import Constructor from "./components/Constructor";
import Analyzer from "./components/Analyzer";
import QuizPlayer from "./components/QuizPlayer"; // Импортируем плеер
import { LayoutDashboard, FileSpreadsheet, PenTool } from "lucide-react";
import "./App.css";

function App() {
  // --- ПРОВЕРКА ССЫЛКИ ДЛЯ ШЕРИНГА ---
  const path = window.location.pathname;
  if (path.startsWith("/quiz/")) {
    const quizId = path.split("/quiz/")[1];
    return <QuizPlayer quizId={quizId} />;
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
          </nav>
        </div>
      </header>

      <main className="main-content">
        {activeTab === "constructor" ? <Constructor /> : <Analyzer />}
      </main>
    </div>
  );
}

export default App;
