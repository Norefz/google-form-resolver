const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
app.use(cors()); // Allow requests from Chrome Extension
app.use(express.json());

// Limit each IP to 15 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: "Rate limit exceeded. Please wait 15 minutes." },
});
app.use("/api/", limiter);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/analyze-question", async (req, res) => {
  try {
    const { question, options } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Act as an expert educator. Analyze the following multiple-choice question:
      Question: "${question}"
      Options: ${options.join(", ")}

      Return a JSON object with this exact structure:
      {
        "correct_answer": "the exact text of the correct option",
        "reasoning": "A concise explanation of why this answer is correct and why others are wrong.",
        "confidence": "0-100%"
      }
      Only return the JSON. No conversational filler.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, ""); // Clean Markdown

    res.json(JSON.parse(text));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Secure Server running on port ${PORT}`));
