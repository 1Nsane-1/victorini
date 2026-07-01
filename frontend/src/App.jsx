import React, { useState } from "react";
import Constructor from "./components/Constructor";
import Analyzer from "./components/Analyzer";
import { LayoutDashboard, FileSpreadsheet } from "lucide-react";

function App() {
  const [activeTab, setActiveTab] = useState("constructor");

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Local Quiz Builder
          </div>
          <nav className="flex space-x-2">
            <button
              onClick={() => setActiveTab("constructor")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${activeTab === "constructor" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
            >
              <LayoutDashboard size={18} /> Конструктор
            </button>
            <button
              onClick={() => setActiveTab("analyzer")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${activeTab === "analyzer" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
            >
              <FileSpreadsheet size={18} /> Анализатор
            </button>
          </nav>
        </div>
      </header>

      <main className="p-4 md:p-8">
        {activeTab === "constructor" ? <Constructor /> : <Analyzer />}
      </main>
    </div>
  );
}

export default App;
