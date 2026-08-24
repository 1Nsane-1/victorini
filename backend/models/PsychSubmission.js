const mongoose = require("mongoose");

const psychSubmissionSchema = new mongoose.Schema({
  studentName: { type: String, required: true, default: "Аноним" },
  folder: { type: String, required: true, default: "1" }, // Имя папки
  answers: { type: mongoose.Schema.Types.Mixed, default: [] }, // Ответы студента
  testTitle: { type: String, default: "Психологический тест" },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PsychSubmission", psychSubmissionSchema);
