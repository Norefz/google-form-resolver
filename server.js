const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
app.use(cors()); // Ini wajib supaya extension bisa "ngobrol" sama server
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/solve", async (req, res) => {
  console.log("Menerima soal dari Browser...");
  try {
    const { question, options } = req.body;

    // Gunakan model yang tadi kamu tes berhasil
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Berikan jawaban untuk soal ini.
        Pertanyaan: "${question}"
        Pilihan: ${options.length > 0 ? options.join(", ") : "Soal Esai"}
        
        Balas HANYA dengan format JSON murni:
        {"answer": "teks jawaban", "reason": "penjelasan singkat"}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Membersihkan teks jika AI memberikan format ```json ... ```
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];

    console.log("AI berhasil menjawab!");
    res.json(JSON.parse(text));
  } catch (error) {
    console.error("Error di Server:", error.message);
    res.status(500).json({
      answer: "Gagal memproses jawaban",
      reason: error.message,
    });
  }
});

app.listen(3000, () => console.log("✅ Server Otak AI aktif di port 3000"));
