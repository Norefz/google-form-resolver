const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/solve", async (req, res) => {
  try {
    const { question, options } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemma-3-1b-it" });
    const isMultipleChoice = options && options.length > 0;

    // PROMPT RINGKAS: Menghapus instruksi panjang & field "reason"
    const prompt = isMultipleChoice
      ? `Q: ${question}\nOpts: ${options.join(" | ")}\nJSON: {"answer":"chosen_option_text"}`
      : `Q: ${question}\nJSON: {"answer":"short_answer"}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        // Kunci utama hemat: batasi output maksimal hanya ~30-40 token
        maxOutputTokens: isMultipleChoice ? 20 : 50,
        temperature: 0.1, // Biar jawaban konsisten dan gak 'halu'
      },
    });

    const response = await result.response;
    const text = response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    // Mengembalikan JSON yang sesuai dengan kebutuhan frontend-mu
    const parsed = JSON.parse(text);

    // Kita tambahkan reason dummy/kosong agar content.js tidak error
    res.json({
      answer: parsed.answer,
      reason: "Optimized for tokens",
      type: isMultipleChoice ? "multiple" : "essay",
    });
  } catch (error) {
    console.error("Token Error:", error.message);
    res.status(500).json({ answer: "Error", reason: "Check console" });
  }
});

app.listen(3000, () => console.log("🚀 Server High-Efficiency on 3000"));
