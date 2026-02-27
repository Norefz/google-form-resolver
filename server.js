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
Role: Highly accurate Academic Expert and Professional Test-Solver.
Task: Analyze the provided question and deliver the most accurate response.

Question: ${question}
${isMultipleChoice ? `Options: ${options.join(" | ")}` : "Task: Provide a comprehensive and detailed essay response."}

Rules:
1. FOR MULTIPLE CHOICE: 
   - Output ONLY the exact text of the correct option. 
   - Strictly NO additional words, prose, or explanations.
   
2. FOR ESSAY/URAIAN: 
   - Provide a deep, thorough, and informative explanation. 
   - Ensure the answer is academic and comprehensive.
   - Use the same language as the question (if Indonesian, respond in Indonesian).
   
3. NO INTRODUCTIONS: Do not use phrases like "The answer is..." or "Based on my analysis...". Start immediately with the core answer.
4. FACT-CHECK: Ensure accuracy based on official academic standards.

Final Answer:`;

  // Fungsi internal untuk eksekusi AI dengan fitur Retry
  const generateAnswer = async (retries = 3) => {
    try {
      // Pastikan nama model benar (Gemini 1.5 Flash adalah versi stabil yang ada sekarang)
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: isMultipleChoice ? 20 : 300,
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
