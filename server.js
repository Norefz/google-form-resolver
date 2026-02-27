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

  // --- MASTER PROMPT TEROPTIMASI ---
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

Final Answer:`; // Fungsi internal untuk eksekusi AI dengan fitur Retry
  const generateAnswer = async (retries = 3) => {
    try {
      // Pastikan nama model benar (Gemini 1.5 Flash adalah versi stabil yang ada sekarang)
      // const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });
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
