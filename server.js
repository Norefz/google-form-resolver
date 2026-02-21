const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/solve", async (req, res) => {
  const { question, options } = req.body;
  const isMultipleChoice = options && options.length > 0;

  // --- MASTER PROMPT UNIVERSAL (ENGLISH) ---
  const prompt = `
Role: Highly accurate Academic Expert & Professional Test-Solver.
Task: Analyze the question and options below, then select the single most correct answer.

Question: ${question}
${isMultipleChoice ? `Options: ${options.join(" | ")}` : ""}

Rules:
1. FACT-CHECK: Use your internal database for subjects like History, Science, Math, etc.
2. FORMAT: Output ONLY the exact text of the correct answer.
3. NO PROSE: Do not use phrases like "The answer is" or provide any explanation.
4. ADAPTATION: If the question is in Indonesian, choose the Indonesian option.
5. REASONING: Think step-by-step internally, but only output the final text.

Final Answer:`;

  // Fungsi internal untuk eksekusi AI dengan fitur Retry
  const generateAnswer = async (retries = 3) => {
    try {
      // Pastikan nama model benar (Gemini 1.5 Flash adalah versi stabil yang ada sekarang)
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 30, // Tetap 30 agar jawaban tidak terpotong
          temperature: 0.1,
        },
      });

      return result.response.text().trim();
    } catch (error) {
      // Jika kena limit (Rate Limit 429) dan masih ada jatah retry
      if (error.message.includes("429") && retries > 0) {
        console.warn(
          `⚠️ Limit tercapai. Mencoba lagi dalam 5 detik... (Sisa retry: ${retries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Nunggu 5 detik
        return generateAnswer(retries - 1);
      }
      throw error; // Lempar error jika bukan 429 atau retry habis
    }
  };

  try {
    const aiResponse = await generateAnswer();
    console.log("AI Response:", aiResponse);

    res.json({
      answer: aiResponse,
      reason: "Success",
      type: isMultipleChoice ? "multiple" : "essay",
    });
  } catch (error) {
    console.error("Final Error:", error.message);
    res.status(500).json({
      answer: "Gagal memproses soal",
      reason: "Server limit atau API error. Coba lagi beberapa saat lagi.",
    });
  }
});

app.listen(3000, () => console.log("🚀 Server High-Efficiency on 3000"));
