require("dotenv").config();

async function listModelsDirectly() {
  const API_KEY = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

  console.log("--- Connecting to Google Server Directly ---");

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("Error dari Google:", data.error.message);
      return;
    }

    console.log("Models available for your API Key:");
    data.models.forEach((m) => {
      // Only show models that support generateContent
      if (m.supportedGenerationMethods.includes("generateContent")) {
        console.log(`- ${m.name.replace("models/", "")} (${m.displayName})`);
      }
    });
  console.log("\n--- Done ---");
  console.log("Use the name above (without 'models/') in your server.js.");
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}

listModelsDirectly();
