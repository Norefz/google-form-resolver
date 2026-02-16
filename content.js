const API_URL = "http://localhost:3000/api/solve";

function injectAI() {
  const blocks = document.querySelectorAll('.geS5n, div[role="listitem"]');

  blocks.forEach((block) => {
    if (block.querySelector(".gemini-btn")) return;

    const btn = document.createElement("button");
    btn.innerText = "Get AI Answer ✨";
    btn.className = "gemini-btn";
    btn.style =
      "margin: 10px; padding: 10px; background: #673ab7; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;";

    const resultDisplay = document.createElement("div");
    resultDisplay.style =
      "display: none; margin: 10px; padding: 15px; border-left: 5px solid #673ab7; background: #f3f0ff; border-radius: 4px; color: #333;";

    btn.onclick = async (e) => {
      e.preventDefault();

      // Selector yang lebih luas untuk Pertanyaan
      const qEl =
        block.querySelector('[role="heading"]') ||
        block.querySelector('div[dir="auto"]') ||
        block.querySelector(".M7eC3");

      // Selector untuk Pilihan Ganda
      const oEls = Array.from(
        block.querySelectorAll(
          '[role="radio"], [role="checkbox"], .aDTYp, .docssharedWizToggleLabeledLabelText',
        ),
      );

      const question = qEl ? qEl.innerText.trim() : null;
      const options = oEls
        .map((el) => el.innerText.trim())
        .filter((t) => t.length > 0);

      console.log("Scraped Question:", question);
      console.log("Scraped Options:", options);

      // PERBAIKAN: Jangan blokir jika options kosong (mungkin soal essay)
      if (!question) {
        alert("Gagal mengambil teks pertanyaan.");
        return;
      }

      btn.innerText = "Thinking... 🧠";
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, options }),
        });
        const data = await res.json();

        resultDisplay.innerHTML = `
                    <div style="margin-bottom: 8px;"><strong>Jawaban AI:</strong><br>${data.answer}</div>
                    <div style="font-size: 0.85em; color: #666; border-top: 1px solid #ccc; padding-top: 5px;">
                        <strong>Penjelasan:</strong><br>${data.reason}
                    </div>
                `;
        resultDisplay.style.display = "block";
      } catch (err) {
        alert("Server Node.js mati atau error! Cek terminal.");
      } finally {
        btn.innerText = "Get AI Answer ✨";
      }
    };

    block.appendChild(btn);
    block.appendChild(resultDisplay);
  });
}
setInterval(injectAI, 2000);
