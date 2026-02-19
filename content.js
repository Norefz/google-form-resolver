const API_URL = "http://localhost:3000/api/solve";

function injectAI() {
  // Target kontainer soal sesuai inspect element kamu (.geS5n)
  const blocks = document.querySelectorAll(".geS5n");

  blocks.forEach((block) => {
    if (block.dataset.aiInjected === "true") return;
    block.dataset.aiInjected = "true";

    const container = document.createElement("div");
    container.className = "ai-solve-container";
    container.style =
      "margin-top: 15px; padding: 10px; border-top: 1px solid rgb(238, 238, 238); clear: both;";

    const btn = document.createElement("button");
    btn.innerText = "Solve with AI ✨";
    btn.style =
      "padding: 8px 16px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; font-family: Roboto, Arial, sans-serif;";

    const reasonBox = document.createElement("div");
    reasonBox.style =
      "display: none; margin-top: 10px; padding: 12px; background: #f8f9fa; border-radius: 4px; font-size: 13px; color: #3c4043; border-left: 4px solid #1a73e8; line-height: 1.4;";

    btn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // 1. Ambil Pertanyaan
      const qEl = block.querySelector(".M7eMe");
      const questionText = qEl ? qEl.innerText.trim() : "";

      // 2. Ambil Opsi & Kontainer Klik-nya
      // Di Google Forms, teks ada di .docssharedWizToggleLabeledLabelText
      // Tapi yang bisa diklik biasanya parent-nya yang punya role="radio" atau jsname
      const optionLabels = Array.from(
        block.querySelectorAll(".docssharedWizToggleLabeledLabelText, .aDTYp"),
      );
      const optionsText = optionLabels.map(
        (el, i) => `${i}. ${el.innerText.trim()}`,
      );

      btn.innerText = "Thinking...";
      btn.disabled = true;

      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: questionText,
            options: optionsText,
            // PROMPT SAKTI: Memaksa AI memberikan index yang benar
            system_prompt:
              "You are a quiz solver. Choose the best answer ONLY from the provided options. Return JSON: { 'index': number, 'answer': 'text' }",
          }),
        });

        const data = await res.json();

        // Tampilkan jawaban AI di kotak
        reasonBox.innerHTML = `<strong>AI Result:</strong> <span style="color:#188038">${data.answer}</span><br><br>${data.reason || ""}`;
        reasonBox.style.display = "block";

        // 3. LOGIKA AUTO-FILL ABC (Google Forms Specialized)
        let clicked = false;

        // PRIORITAS 1: Gunakan Index dari AI
        if (data.index !== undefined && optionLabels[data.index]) {
          const target = optionLabels[data.index];
          klikElemenGoogle(target);
          clicked = true;
        }
        // PRIORITAS 2: Fuzzy Matching Teks
        else {
          const aiAnsClean = data.answer.toLowerCase().trim();
          for (let label of optionLabels) {
            const labelText = label.innerText.toLowerCase().trim();
            if (
              labelText.includes(aiAnsClean) ||
              aiAnsClean.includes(labelText)
            ) {
              klikElemenGoogle(label);
              clicked = true;
              break;
            }
          }
        }

        btn.innerText = clicked ? "Solved! ✅" : "Match Failed ⚠️";
        btn.style.background = clicked ? "#188038" : "#f9ab00";
      } catch (err) {
        console.error(err);
        btn.innerText = "Error ❌";
        btn.style.background = "#d93025";
      } finally {
        btn.disabled = false;
        setTimeout(() => {
          btn.innerText = "Solve with AI ✨";
          btn.style.background = "#1a73e8";
        }, 5000);
      }
    };

    // Fungsi pembantu khusus untuk mentrigger klik di Google Forms
    function klikElemenGoogle(el) {
      // Cari pembungkus yang memiliki role radio/checkbox atau jsaction
      const wrapper = el.closest(
        '[role="radio"], [role="checkbox"], [jsname="L9Z70c"], .uMCH9b',
      );
      if (wrapper) {
        console.log("Clicking wrapper:", wrapper);
        wrapper.click();
        // Google Forms butuh event mouse manual terkadang
        wrapper.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        wrapper.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      } else {
        el.click();
      }
    }

    container.appendChild(btn);
    container.appendChild(reasonBox);
    block.appendChild(container);
  });
}

// Jalankan injeksi secara berkala
setInterval(injectAI, 2000);
