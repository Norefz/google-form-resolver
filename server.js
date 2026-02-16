// server.js
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
app.use(cors()); // Crucial: Allows the Extension to talk to this server
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/analyze-question", async (req, res) => {
  console.log("--- Request Received ---");
  try {
    const { question, options } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
            Act as an educator. Analyze this multiple-choice question:
            Question: "${question}"
            Options: ${options.join(", ")}

            Return ONLY a JSON object:
            {
              "correct_answer": "text of the answer",
              "reasoning": "explanation of why it is correct",
              "confidence": "0-100%"
            }
        `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    // Removes markdown code blocks if the AI includes them
    const text = response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    console.log("Gemini Response:", text);
    res.json(JSON.parse(text));
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Backend running on http://localhost:${PORT}`),
);
