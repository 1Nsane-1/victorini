const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Раздача статических файлов из собранного React-приложения
const frontendBuildPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendBuildPath));

// Любой маршрут перенаправляется на index.html для поддержки React Router
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n=========================================`);
  console.log(`Сервер запущен: http://localhost:${PORT}`);
  console.log(`=========================================\n`);
});
