const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { Document, Packer, Paragraph, TextRun } = require("docx");

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

  // Подключаем шрифт Arial для поддержки русского языка
  const fontPath = path.join(__dirname, "Arial.ttf");
  if (fs.existsSync(fontPath)) {
    doc.font(fontPath);
  } else {
    console.warn(
      "⚠️ Файл Arial.ttf не найден в папке backend! Кириллица может отображаться некорректно.",
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

app.listen(PORT, () => {
  console.log(`\n=========================================`);
  console.log(`API Сервер запущен: http://localhost:${PORT}`);
  console.log(`=========================================\n`);
});
