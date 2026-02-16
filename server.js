const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/solve", async (req, res) => {
  console.log("Request masuk untuk soal:", req.body.question);
  try {
    const { question, options } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prompt yang fleksibel untuk pilihan ganda maupun essay
    const prompt = `Berikan jawaban untuk pertanyaan berikut. 
        Pertanyaan: "${question}"
        Pilihan (jika ada): ${options.length > 0 ? options.join(", ") : "Tidak ada (Soal Essay)"}
        
        Berikan respon dalam format JSON murni: 
        {"answer": "jawaban singkat", "reason": "penjelasan singkat"}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    res.json(JSON.parse(text));
  } catch (error) {
    console.error("Gemini Error:", error.message);
    res
      .status(500)
      .json({ answer: "Gagal terhubung ke AI", reason: error.message });
  }
});

app.listen(3000, () => console.log("✅ Server aktif di port 3000"));
