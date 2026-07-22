export const generateTestHTML = (quizData) => {
  const dataString = JSON.stringify(quizData);
  return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${quizData.title || "Тестирование"}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .fade-in { animation: fadeIn 0.5s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body class="bg-gray-100 min-h-screen p-4 md:p-8 flex items-center justify-center">
    <div id="app" class="w-full max-w-2xl bg-white rounded-xl shadow-lg p-6 md:p-10 fade-in">
        </div>

    <script>
        const quizData = ${dataString};
        let currentUser = "";
        let currentAnswers = {};
        
        const appDiv = document.getElementById('app');

        function renderAuth() {
            appDiv.innerHTML = \`
                <h1 class="text-3xl font-bold text-gray-800 mb-6 text-center">\${quizData.title || 'Вход в тестирование'}</h1>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Введите ваше ФИО</label>
                        <input type="text" id="fio" onkeydown="if(event.key === 'Enter') startTest()" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Иванов Иван Иванович">
                    </div>
                    <button onclick="startTest()" class="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition">Начать тест</button>
                </div>
            \`;
        }

        function startTest() {
            const fioInput = document.getElementById('fio').value.trim();
            if (!fioInput) {
                alert("Пожалуйста, введите ФИО");
                return;
            }
            currentUser = fioInput;
            renderQuestions();
        }

        function renderQuestions() {
            let questionsHtml = quizData.questions.map((q, qIndex) => {
                let optionsHtml = q.options.map((opt, oIndex) => {
                    const inputType = q.type === 'radio' ? 'radio' : 'checkbox';
                    const name = q.type === 'radio' ? \`q_\${qIndex}\` : \`q_\${qIndex}_\${oIndex}\`;
                    return \`
                        <label class="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition">
                            <input type="\${inputType}" name="\${name}" value="\${oIndex}" onchange="saveAnswer(\${qIndex}, \${oIndex}, '\${q.type}', this.checked)" class="h-4 w-4 text-blue-600 focus:ring-blue-500">
                            <span class="text-gray-700">\${opt}</span>
                        </label>
                    \`;
                }).join('');

                return \`
                    <div class="mb-8 p-6 border border-gray-100 rounded-xl bg-gray-50 fade-in">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">\${qIndex + 1}. \${q.text}</h3>
                        <div class="space-y-2">
                            \${optionsHtml}
                        </div>
                    </div>
                \`;
            }).join('');

            appDiv.innerHTML = \`
                <h2 class="text-2xl font-bold text-gray-800 mb-6">\${quizData.title}</h2>
                <div class="space-y-6">
                    \${questionsHtml}
                </div>
                <button onclick="finishTest()" class="w-full mt-6 bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition">Завершить тест</button>
            \`;
        }

        function saveAnswer(qIndex, oIndex, type, isChecked) {
            if (!currentAnswers[qIndex]) currentAnswers[qIndex] = [];
            
            if (type === 'radio') {
                currentAnswers[qIndex] = [oIndex];
            } else {
                if (isChecked) {
                    currentAnswers[qIndex].push(oIndex);
                } else {
                    currentAnswers[qIndex] = currentAnswers[qIndex].filter(val => val !== oIndex);
                }
            }
        }

        function finishTest() {
            if (!confirm("Вы уверены, что хотите завершить тест?")) return;

            let score = 0;
            const detailedResults = quizData.questions.map((q, index) => {
                const userAns = currentAnswers[index] || [];
                const correctAns = q.correctAnswers;
                
                // Проверка: массивы должны совпадать по элементам
                const isCorrect = userAns.length === correctAns.length && 
                                  userAns.every(val => correctAns.includes(val));
                
                if (isCorrect) score += (quizData.pointsPerQuestion || 1);
                
                return {
                    question: q.text,
                    isCorrect: isCorrect,
                    userAnswers: userAns,
                    correctAnswers: correctAns
                };
            });

            const maxScore = quizData.questions.length * (quizData.pointsPerQuestion || 1);
            const passScore = quizData.passScore || (maxScore / 2);
            
            let passed = false;
            if (quizData.passMode === 'percentage') {
                const percentScored = (score / maxScore) * 100;
                passed = percentScored >= passScore;
            } else {
                passed = score >= passScore;
            }

            const resultData = {
                fio: currentUser,
                score: score,
                maxScore: maxScore,
                passed: passed,
                details: detailedResults,
                timestamp: new Date().toISOString()
            };

            downloadJson(resultData);
            renderResult(resultData);
        }

        function renderResult(result) {
            const statusColor = result.passed ? 'text-green-600' : 'text-red-600';
            const statusText = result.passed ? 'Тест успешно пройден!' : 'Тест не пройден';

            appDiv.innerHTML = \`
                <div class="text-center fade-in">
                    <h2 class="text-3xl font-bold \${statusColor} mb-4">\${statusText}</h2>
                    <p class="text-xl text-gray-700 mb-6">Студент: \${result.fio}</p>
                    <div class="text-5xl font-extrabold text-gray-900 mb-2">\${result.score} / \${result.maxScore}</div>
                    <p class="text-gray-500 mb-8">баллов</p>
                    <p class="text-sm text-gray-400">Файл с результатами был автоматически скачан на ваше устройство.</p>
                </div>
            \`;
        }

        function downloadJson(data) {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            const safeName = data.fio.replace(/[^a-zа-яё0-9]/gi, '_');
            downloadAnchorNode.setAttribute("download", \`\${safeName}_result.json\`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }

        // Инициализация
        renderAuth();
    </script>
</body>
</html>`;
};
