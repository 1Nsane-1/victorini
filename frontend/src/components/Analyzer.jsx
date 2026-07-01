import React, { useState } from "react";
import { UploadCloud, Users, CheckCircle, XCircle } from "lucide-react";

export default function Analyzer() {
  const [results, setResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result);
          setResults((prev) => [...prev, json]);
        } catch (error) {
          console.error("Ошибка чтения файла", file.name);
        }
      };
      reader.readAsText(file);
    });
  };

  const totalStudents = results.length;
  const passedStudents = results.filter((r) => r.passed).length;
  const avgScore = totalStudents
    ? (
        results.reduce((acc, curr) => acc + curr.score, 0) / totalStudents
      ).toFixed(1)
    : 0;
  const passRate = totalStudents
    ? Math.round((passedStudents / totalStudents) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Зона загрузки */}
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-10 text-center mb-8 relative hover:border-blue-500 transition-colors">
        <input
          type="file"
          multiple
          accept=".json"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <UploadCloud className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-xl font-semibold text-gray-700">
          Загрузите файлы результатов (.json)
        </h3>
        <p className="text-gray-500 mt-2">
          Перетащите файлы сюда или нажмите для выбора
        </p>
      </div>

      {/* Сводная статистика */}
      {totalStudents > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center">
            <Users className="text-blue-500 mb-2" size={32} />
            <div className="text-3xl font-bold text-gray-800">
              {totalStudents}
            </div>
            <div className="text-sm text-gray-500">Сдавших</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center">
            <CheckCircle className="text-green-500 mb-2" size={32} />
            <div className="text-3xl font-bold text-gray-800">
              {passedStudents}
            </div>
            <div className="text-sm text-gray-500">Успешно</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center">
            <XCircle className="text-red-500 mb-2" size={32} />
            <div className="text-3xl font-bold text-gray-800">
              {totalStudents - passedStudents}
            </div>
            <div className="text-sm text-gray-500">Провалили</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center">
            <div className="text-blue-500 font-bold text-2xl mb-2">AVG</div>
            <div className="text-3xl font-bold text-gray-800">{avgScore}</div>
            <div className="text-sm text-gray-500">Средний балл</div>
          </div>
        </div>
      )}

      {/* Таблица результатов */}
      {totalStudents > 0 && (
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-4 font-semibold">ФИО</th>
                  <th className="p-4 font-semibold">Балл</th>
                  <th className="p-4 font-semibold">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((res, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setSelectedStudent(res)}
                    className={`cursor-pointer hover:bg-blue-50 transition-colors ${selectedStudent?.fio === res.fio ? "bg-blue-50" : ""}`}
                  >
                    <td className="p-4 font-medium text-gray-800">{res.fio}</td>
                    <td className="p-4">
                      {res.score} / {res.maxScore}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${res.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {res.passed ? "Сдал" : "Не сдал"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Детальный просмотр */}
          {selectedStudent && (
            <div className="flex-1 bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Ответы: {selectedStudent.fio}
              </h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {selectedStudent.details.map((det, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${det.isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}
                  >
                    <p className="font-semibold text-gray-800 mb-2">
                      {idx + 1}. {det.question}
                    </p>
                    <div className="text-sm">
                      <span
                        className={
                          det.isCorrect
                            ? "text-green-700 font-medium"
                            : "text-red-700 font-medium"
                        }
                      >
                        {det.isCorrect ? "✓ Верно" : "✗ Ошибка"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
