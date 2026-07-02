import React, { useState, useEffect } from "react";
import Constructor from "./components/Constructor";
import Analyzer from "./components/Analyzer";
import {
  LayoutDashboard,
  FileSpreadsheet,
  PenLine,
  Sun,
  Moon,
} from "lucide-react";
import "./App.css";

const THEME_KEY = "quiz-builder:theme";

function App() {
  const [activeTab, setActiveTab] = useState("constructor");
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) return saved;
    } catch {}
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-[var(--paper-raised)] border-b border-[var(--line)] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full border-2 border-dashed border-[var(--line-strong)] flex items-center justify-center text-[var(--navy)]">
              <PenLine size={18} />
            </div>
            <div>
              <div className="font-mono font-bold text-lg tracking-tight text-[var(--ink)] leading-tight">
                Test&nbsp;Builder
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--graphite)]">
                Локальный конструктор тестов
              </div>
            </div>
          </div>

          <nav className="flex gap-1 font-mono text-sm">
            <button
              onClick={() => setActiveTab("constructor")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg border-b-[3px] transition-colors ${
                activeTab === "constructor"
                  ? "border-[var(--navy)] text-[var(--navy)] bg-[var(--navy-soft)]"
                  : "border-transparent text-[var(--ink-soft)] hover:bg-[var(--paper)]"
              }`}
            >
              <LayoutDashboard size={16} /> Конструктор
            </button>
            <button
              onClick={() => setActiveTab("analyzer")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg border-b-[3px] transition-colors ${
                activeTab === "analyzer"
                  ? "border-[var(--navy)] text-[var(--navy)] bg-[var(--navy-soft)]"
                  : "border-transparent text-[var(--ink-soft)] hover:bg-[var(--paper)]"
              }`}
            >
              <FileSpreadsheet size={16} /> Анализатор
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="theme-toggle ml-2"
              title="Переключить тему"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </nav>
        </div>
      </header>

      <main className="p-4 md:p-8 flex-1">
        {activeTab === "constructor" ? <Constructor /> : <Analyzer />}
      </main>

      <footer className="border-t border-[var(--line)] py-4 text-center font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--graphite)]">
        Все данные остаются на этом устройстве
      </footer>
    </div>
  );
}

export default App;
