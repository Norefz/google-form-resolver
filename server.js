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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const isMultipleChoice = options && options.length > 0;

    const prompt = `Task: Solve this Google Form question.
        Question: "${question}"
        ${isMultipleChoice ? `Options: ${options.join(" | ")}. Rule: Pick the option that matches best.` : "Essay: Answer concisely."}
        
        Return ONLY valid JSON:
        {"answer": "text_answer", "reason": "short_explanation", "type": "${isMultipleChoice ? "multiple" : "essay"}"}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    // Bersihkan markdown json ```json ... ``` jika ada
    const text = response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    res.json(JSON.parse(text));
  } catch (error) {
    console.error(error);
    res.status(500).json({ answer: "Error", reason: "Server error" });
  }
});

app.listen(3000, () => console.log("🚀 Server Stable on 3000"));
