require("dotenv").config();

async function listModelsDirectly() {
  const API_KEY = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

  console.log("--- Menghubungi Server Google Langsung ---");

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("Error dari Google:", data.error.message);
      return;
    }

    console.log("Model yang tersedia untuk API Key kamu:");
    data.models.forEach((m) => {
      // Kita cuma tampilin yang dukung generateContent
      if (m.supportedGenerationMethods.includes("generateContent")) {
        console.log(`- ${m.name.replace("models/", "")} (${m.displayName})`);
      }
    });
    console.log("\n--- Selesai ---");
    console.log("Gunakan nama di atas (tanpa 'models/') di server.js kamu.");
  } catch (err) {
    console.error("Gagal koneksi:", err.message);
  }
}

listModelsDirectly();
