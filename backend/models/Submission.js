const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Survey",
    required: true,
  },
  quizTitle: String,
  studentName: { type: String, required: true },

  // --- ДОБАВЛЕННЫЕ ПОЛЯ ДЛЯ АНАЛИЗАТОРА ---
  fio: { type: String },
  details: { type: Array, default: [] },
  // ----------------------------------------

  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  folder: { type: String, default: "Общая" },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Submission", submissionSchema);
