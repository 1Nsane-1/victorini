const mongoose = require("mongoose");

// Схема для отдельного модульного блока (текст, картинка или вопрос)
const blockSchema = new mongoose.Schema({
  type: { type: String, required: true }, // Сюда будет прилетать тип: 'text', 'image' или 'question'
  content: { type: mongoose.Schema.Types.Mixed, required: true }, // Mixed позволяет хранить что угодно: строку текста, URL картинки или массив вариантов ответов
});

// Главная схема самого опроса
const surveySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  blocks: [blockSchema], // Тот самый массив, где будут по порядку лежать все блоки
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Survey", surveySchema);
