const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { Document, Packer, Paragraph, TextRun } = require("docx");
require("dotenv").config();
const mongoose = require("mongoose");
const PsychSubmission = require("./models/PsychSubmission");
const Survey = require("./models/Survey");
const Submission = require("./models/Submission");
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ База данных MongoDB успешно подключена!"))
  .catch((err) => console.error("❌ Ошибка подключения к MongoDB:", err));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. Настройка импорта (сохранение локально в папки)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderName = req.body.folder || "default";
    const dir = path.join(__dirname, "uploads", folderName);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

app.post("/api/upload", upload.array("files"), (req, res) => {
  res.json({ message: "Файлы успешно сохранены на сервере", files: req.files });
});

// 2. Настройка экспорта (Excel, PDF, DOCX)

app.post("/api/export/excel", async (req, res) => {
  const { data } = req.body;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Результаты");

  worksheet.columns = [
    { header: "ФИО", key: "fio", width: 35 },
    { header: "Балл", key: "score", width: 10 },
    { header: "Макс. Балл", key: "maxScore", width: 15 },
    { header: "Статус", key: "passed", width: 15 },
  ];

  data.forEach((item) => {
    worksheet.addRow({
      fio: item.fio,
      score: item.score,
      maxScore: item.maxScore,
      passed: item.passed ? "Сдал" : "Не сдал",
    });
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", 'attachment; filename="results.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

// Найти и заменить существующий эндпоинт /api/export/pdf:
app.post("/api/export/pdf", (req, res) => {
  const { data } = req.body;
  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="results.pdf"');
  doc.pipe(res);

  // Подключаем шрифт Roboto из папки fonts для поддержки русского языка
  const fontPath = path.join(__dirname, "fonts", "Roboto-Regular.ttf");
  if (fs.existsSync(fontPath)) {
    doc.font(fontPath);
  } else {
    console.warn(
      "⚠️ Файл Roboto-Regular.ttf не найден в папке fonts! Кириллица может отображаться некорректно.",
    );
  }

  doc.fontSize(20).text("Результаты тестирования", { align: "center" });
  doc.moveDown();

  data.forEach((item, index) => {
    doc
      .fontSize(12)
      .text(
        `${index + 1}. ${item.fio} — ${item.score}/${item.maxScore} (${item.passed ? "Сдал" : "Не сдал"})`,
      );
    doc.moveDown(0.5);
  });

  doc.end();
});

app.post("/api/export/docx", async (req, res) => {
  const { data } = req.body;

  const children = [
    new Paragraph({
      children: [
        new TextRun({ text: "Результаты тестирования", bold: true, size: 32 }),
      ],
    }),
  ];

  data.forEach((item, index) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${index + 1}. ${item.fio} - ${item.score}/${item.maxScore} (${item.passed ? "Сдал" : "Не сдал"})`,
            size: 24,
          }),
        ],
      }),
    );
  });

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const b64string = await Packer.toBuffer(doc);

  res.setHeader("Content-Disposition", 'attachment; filename="results.docx"');
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
  res.send(b64string);
});

// 3. Раздача статики и маршрутизация
const frontendBuildPath = path.join(__dirname, "../frontend/dist");

// Если сборка фронтенда есть (например, локально), отдаем её. Если нет (на Render) — отдаем простой статус.
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("Victorini API Server is live and running!");
  });
}
app.use(express.static(frontendBuildPath));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});
// Маршрут 1: Сохранение нового глобального опроса в БД
app.post("/api/surveys", async (req, res) => {
  try {
    const { title, description, blocks } = req.body;

    // Создаем новый документ на основе нашей схемы
    const newSurvey = new Survey({
      title,
      description,
      blocks,
    });

    // Сохраняем документ в MongoDB
    const savedSurvey = await newSurvey.save();

    // Отвечаем фронтенду успехом и отдаем данные (включая сгенерированный базой ID)
    res.status(201).json(savedSurvey);
  } catch (error) {
    console.error("Ошибка сохранения опроса:", error);
    res.status(500).json({ error: "Не удалось сохранить опрос" });
  }
});

// Маршрут 2: Получение опроса по ID (для глобального доступа)
app.get("/api/surveys/:id", async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ error: "Опрос не найден" });
    }
    res.status(200).json(survey);
  } catch (error) {
    res.status(500).json({ error: "Ошибка при поиске опроса" });
  }
});
// Маршрут 3: Сохранение результатов прохождения теста учеником
app.post("/api/submissions", async (req, res) => {
  try {
    const submission = new Submission(req.body);
    await submission.save();
    res
      .status(201)
      .json({ message: "Результат успешно сохранен", id: submission._id });
  } catch (error) {
    console.error("Ошибка сохранения результата:", error);
    res.status(500).json({ error: error.message });
  }
});

// Маршрут 4: Получение результатов по папкам (для твоего Анализатора)
app.get("/api/submissions", async (req, res) => {
  try {
    const { folder } = req.query;
    // Если папка передана, фильтруем по ней. Если нет - отдаем все.
    const filter = folder ? { folder } : {};
    const submissions = await Submission.find(filter).sort({ submittedAt: -1 });
    res.status(200).json(submissions);
  } catch (error) {
    console.error("Ошибка получения результатов:", error);
    res.status(500).json({ error: error.message });
  }
});
// --- 1. ЭНДПОИНТ: Получение списка всех реальных папок с сайта ---
app.get("/api/folders", (req, res) => {
  const uploadsDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Читаем все подпапки из директории uploads
  const folders = fs
    .readdirSync(uploadsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  // Если папок нет вообще, создаем дефолтную папку "1"
  if (folders.length === 0) {
    fs.mkdirSync(path.join(uploadsDir, "1"), { recursive: true });
    return res.json(["1"]);
  }

  res.json(folders);
});

// --- 2. ЭНДПОИНТ: Создание новой папки на сайте ---
app.post("/api/folders", (req, res) => {
  const { folderName } = req.body;
  if (!folderName)
    return res.status(400).json({ error: "Имя папки не указано" });

  const uploadsDir = path.join(__dirname, "uploads");
  const folders = fs
    .readdirSync(uploadsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory());

  if (folders.length >= 15) {
    return res
      .status(400)
      .json({ error: "Достигнут лимит: максимум 15 папок!" });
  }

  const newFolderPath = path.join(uploadsDir, folderName);
  if (!fs.existsSync(newFolderPath)) {
    fs.mkdirSync(newFolderPath, { recursive: true });
  }

  res.json({ message: "Папка успешно создана", folderName });
});
// --- 3. ЭНДПОИНТ: Удаление папки на сайте ---
app.delete("/api/folders/:name", async (req, res) => {
  const folderName = req.params.name;
  const targetPath = path.join(__dirname, "uploads", folderName);

  // Удаляем физическую папку
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }

  // Удаляем результаты из базы данных, привязанные к этой папке
  try {
    await Submission.deleteMany({ folder: folderName });
    res.json({ message: "Папка и все её результаты удалены" });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при удалении из БД" });
  }
});

// --- 4. ЭНДПОИНТ: Переименование папки на сайте ---
app.put("/api/folders/:oldName", async (req, res) => {
  const oldName = req.params.oldName;
  const { newName } = req.body;
  if (!newName) return res.status(400).json({ error: "Новое имя не указано" });

  const uploadsDir = path.join(__dirname, "uploads");
  const oldPath = path.join(uploadsDir, oldName);
  const newPath = path.join(uploadsDir, newName);

  // Переименовываем физическую папку
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
  } else {
    fs.mkdirSync(newPath, { recursive: true }); // Если не было, создадим новую
  }

  // Обновляем имя папки во всех результатах в базе данных
  try {
    await Submission.updateMany(
      { folder: oldName },
      { $set: { folder: newName } },
    );
    res.json({ message: "Папка успешно переименована", newName });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при обновлении БД" });
  }
});
// --- 3. ЭНДПОИНТ: Сохранение ответов ученика (в MongoDB + в .json файл папки) ---
app.post("/api/submissions", async (req, res) => {
  try {
    const { folder, studentName, quizTitle, score, maxScore, passed } =
      req.body;
    const targetFolder = folder || "1";

    // 1. Сохраняем в MongoDB
    const submission = new Submission(req.body);
    await submission.save();

    // 2. Сохраняем физический .json файл в папку на сайте (для Анализатора)
    const folderPath = path.join(__dirname, "uploads", targetFolder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const safeName = studentName.replace(/[^a-zA-Z0-9а-яА-ЯёЁ]/g, "_");
    const fileName = `result_${safeName}_${Date.now()}.json`;

    // Формат файла, который ждет ваш Анализатор
    const jsonResult = {
      fio: studentName,
      quizTitle: quizTitle,
      score: score,
      maxScore: maxScore,
      passed: passed,
      date: new Date().toISOString(),
    };

    fs.writeFileSync(
      path.join(folderPath, fileName),
      JSON.stringify(jsonResult, null, 2),
      "utf8",
    );

    res
      .status(201)
      .json({ message: "Результат сохранен и в БД, и в папку сайта!" });
  } catch (error) {
    console.error("Ошибка сохранения результата:", error);
    res.status(500).json({ error: error.message });
  }
});
// --- ЭНДПОИНТЫ ТОЛЬКО ДЛЯ ВКЛАДКИ ПСИХ. ТЕСТ ---

// 1. Сохранение ответа студента в выбранную папку
app.post("/api/psych-submissions", async (req, res) => {
  try {
    const { studentName, folder, answers, testTitle } = req.body;

    const newResult = new PsychSubmission({
      studentName: studentName || "Аноним",
      folder: folder || "1",
      answers: answers || [],
      testTitle: testTitle || "Психологический тест",
    });

    await newResult.save();
    res
      .status(201)
      .json({ message: "Ответ успешно сохранен в БД!", result: newResult });
  } catch (error) {
    console.error("Ошибка сохранения псих. теста:", error);
    res.status(500).json({ error: "Не удалось сохранить результат" });
  }
});

// 2. Получение списка ответов для конкретной папки
app.get("/api/psych-submissions", async (req, res) => {
  try {
    const { folder } = req.query;
    const filter = folder ? { folder } : {};

    // Ищем только в коллекции псих. тестов
    const results = await PsychSubmission.find(filter).sort({
      submittedAt: -1,
    });
    res.status(200).json(results);
  } catch (error) {
    console.error("Ошибка загрузки результатов псих. теста:", error);
    res.status(500).json({ error: "Не удалось получить результаты" });
  }
});
app.listen(PORT, () => {
  console.log(`\n=========================================`);
  console.log(`API Сервер запущен: http://localhost:${PORT}`);
  console.log(`=========================================\n`);
});
