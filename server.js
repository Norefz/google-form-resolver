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
    // Gunakan gemma-2-2b-it jika 3-1b masih error 400,
    // tapi coba tetap gemma-3-1b-it dulu.
    const model = genAI.getGenerativeModel({ model: "gemma-3-1b-it" });
    const isMultipleChoice = options && options.length > 0;

    // Prompt dibuat SEPEDAS mungkin agar dia tidak bertele-tele
    const prompt = `Answer this question briefly.
Question: ${question}
${isMultipleChoice ? `Options: ${options.join(" | ")}` : ""}
Output format: Just the answer text. No JSON, no explanation.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 30, // Sangat hemat token
        temperature: 0.1,
      },
    });

    const aiResponse = result.response.text().trim();
    console.log("Gemma Response:", aiResponse);

    // Kirim balik sebagai objek JSON ke extension agar tidak error parsing
    res.json({
      answer: aiResponse,
      reason: "Success",
      type: isMultipleChoice ? "multiple" : "essay",
    });
  } catch (error) {
    console.error("Gemma Error:", error.message);
    // Jika gemma-3-1b-it error 400, coba ganti ke gemini-1.5-flash-8b (sangat murah & hemat)
    res
      .status(500)
      .json({ answer: "Gagal memproses soal", reason: error.message });
  }
});

app.listen(3000, () => console.log("🚀 Server High-Efficiency on 3000"));
