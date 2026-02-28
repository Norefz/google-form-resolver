const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- 1. KONFIGURASI DAILY QUOTA ---
const DAILY_QUOTA = 50;

// In-memory storage untuk stats sederhana
let dailyStats = {
  date: new Date().toDateString(),
  solved: 0,
};

// Fungsi reset otomatis jika hari berganti
function checkAndResetDailyStats() {
  const today = new Date().toDateString();
  if (dailyStats.date !== today) {
    dailyStats = { date: today, solved: 0 };
    console.log("📅 Hari berganti, kuota direset!");
  }
}

// --- 2. ENDPOINT UNTUK CEK STATS ---
app.get("/api/stats", (req, res) => {
  checkAndResetDailyStats();
  res.json({
    solved: dailyStats.solved,
    limit: DAILY_QUOTA,
    remaining: Math.max(0, DAILY_QUOTA - dailyStats.solved),
  });
});

app.post("/api/solve", async (req, res) => {
  checkAndResetDailyStats();

  // Cek apakah kuota masih ada sebelum panggil AI
  if (dailyStats.solved >= DAILY_QUOTA) {
    return res.status(429).json({
      answer: "Kuota harian habis",
      reason: "Limit 50 soal tercapai. Coba lagi besok!",
      quota: { solved: dailyStats.solved, limit: DAILY_QUOTA, remaining: 0 },
    });
  }

  const { question, options } = req.body;
  const isMultipleChoice = options && options.length > 0;

  const prompt = `
Role: Expert Academic Professor.
Task: Provide a high-quality answer to the question below.

Question: ${question}
${isMultipleChoice ? `Options: ${options.join(" | ")}` : "Task: ESSAY/URAIAN. Provide a long, detailed, and comprehensive academic explanation."}

Strict Rules for Response:
1. IF MULTIPLE CHOICE (Pilihan Ganda):
   - Provide ONLY the exact text of the correct option.
   - NO explanations. NO extra words.

2.Rules for Essay:
1. EXPLAIN the difference or the answer in a "Definition A vs Definition B" style.
2. KEEP IT SHORT: Use maximum 2 sentences or one clear comparison.
3. NO FILLERS: Use simple, direct Indonesian. Like: "Dasar negara adalah [A], sedangkan pandangan hidup adalah [B]."
4. NO INTROS: Do not start with "The answer is" or "The difference is".

3. STRUCTURE:
   - Start immediately with the answer.
   - NEVER use "The answer is..." or intro phrases.

Final Answer:`;

  const generateAnswer = async (retries = 3) => {
    try {
      // PAKAI MODEL INI BIAR GAK ERROR 404
      const model = genAI.getGenerativeModel({ model: "gemma-3-4b-it" });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: isMultipleChoice ? 30 : 700,
          temperature: isMultipleChoice ? 0.1 : 0.5,
        },
      });

      return result.response.text().trim();
    } catch (error) {
      if (error.message.includes("429") && retries > 0) {
        console.warn(`⚠️ Limit tercapai. Mencoba lagi dalam 5 detik...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return generateAnswer(retries - 1);
      }
      throw error;
    }
  };

  try {
    const aiResponse = await generateAnswer();

    // UPDATE STATS SETELAH BERHASIL
    dailyStats.solved++;
    console.log(`✅ Berhasil: ${dailyStats.solved}/${DAILY_QUOTA}`);

    res.json({
      answer: aiResponse,
      reason: "Success",
      type: isMultipleChoice ? "multiple" : "essay",
      quota: {
        solved: dailyStats.solved,
        limit: DAILY_QUOTA,
        remaining: DAILY_QUOTA - dailyStats.solved,
      },
    });
  } catch (error) {
    console.error("Final Error:", error.message);
    res.status(500).json({
      answer: "Gagal memproses soal",
      reason: "Server limit atau API error.",
      quota: {
        solved: dailyStats.solved,
        limit: DAILY_QUOTA,
        remaining: DAILY_QUOTA - dailyStats.solved,
      },
    });
  }
});

app.listen(3000, () => console.log("🚀 Server High-Efficiency on 3000"));
