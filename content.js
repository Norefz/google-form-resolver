const API_URL = "http://localhost:3000/api/solve";

function injectAI() {
  const blocks = document.querySelectorAll('.geS5n, div[role="listitem"]');

  blocks.forEach((block) => {
    if (block.querySelector(".gemini-btn")) return;

    const btn = document.createElement("button");
    btn.innerText = "Tanya Gemini ✨";
    btn.className = "gemini-btn";
    btn.style =
      "margin: 10px; padding: 10px; background: #673ab7; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;";

    const resultDiv = document.createElement("div");
    resultDiv.style =
      "display: none; margin: 10px; padding: 15px; border-left: 5px solid #673ab7; background: #f3f0ff; border-radius: 4px; color: #333;";

    btn.onclick = async (e) => {
      e.preventDefault();

      // Mencari teks soal
      const qEl =
        block.querySelector('[role="heading"]') ||
        block.querySelector('div[dir="auto"]');
      // Mencari pilihan jawaban
      const oEls = Array.from(
        block.querySelectorAll(
          '[role="radio"], [role="checkbox"], .aDTYp, .docssharedWizToggleLabeledLabelText',
        ),
      );

      const question = qEl ? qEl.innerText.trim() : null;
      const options = oEls
        .map((el) => el.innerText.trim())
        .filter((t) => t.length > 0);

      if (!question) return alert("Soal tidak terdeteksi.");

      btn.innerText = "Mencari Jawaban...";
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, options }),
        });

        const data = await res.json();
        resultDiv.innerHTML = `<strong>Jawaban:</strong> ${data.answer}<br><small><strong>Penjelasan:</strong> ${data.reason}</small>`;
        resultDiv.style.display = "block";
      } catch (err) {
        alert(
          "Koneksi ke Server Gagal! Pastikan 'node server.js' sedang jalan di terminal.",
        );
      } finally {
        btn.innerText = "Tanya Gemini ✨";
      }
    };

    block.appendChild(btn);
    block.appendChild(resultDiv);
  });
}
setInterval(injectAI, 2000);
