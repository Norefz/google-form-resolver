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
    // Using the fastest low-latency model available
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const isMultipleChoice = options && options.length > 0;

    const prompt = `Task: Solve this Google Form question accurately.
        Question: "${question}"
        ${
          isMultipleChoice
            ? `Options: ${options.join(" | ")}. \nStrict Rule: You MUST pick the exact text from the options provided.`
            : `Context: This is an essay/short answer question. Provide a direct and concise answer.`
        }
        
        Response Format (JSON ONLY):
        {"answer": "your_selected_option_or_essay_text", "type": "${isMultipleChoice ? "multiple" : "essay"}"}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().match(/\{[\s\S]*\}/)[0];

    console.log(`Solved: ${isMultipleChoice ? "Multiple Choice" : "Essay"}`);
    res.json(JSON.parse(text));
  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({ answer: "Error", type: "error" });
  }
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`🚀 AI Server running at http://localhost:${PORT}`),
);
