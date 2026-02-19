const API_URL = "http://localhost:3000/api/solve";

function injectAI() {
  const blocks = document.querySelectorAll(".geS5n");

  blocks.forEach((block) => {
    if (block.dataset.aiInjected === "true") return;
    block.dataset.aiInjected = "true";

    const container = document.createElement("div");
    container.className = "ai-solve-container";
    container.style =
      "margin-top: 15px; padding: 10px; border-top: 1px solid #eee;";

    const btn = document.createElement("button");
    btn.innerText = "Solve with AI ✨";
    btn.style =
      "padding: 8px 15px; background: #1a73e8; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;";

    const reasonBox = document.createElement("div");
    reasonBox.style =
      "display: none; margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px; font-size: 13px; border-left: 4px solid #1a73e8;";

    btn.onclick = async (e) => {
      e.preventDefault();

      const qEl = block.querySelector(".M7eMe");
      // Ambil elemen opsi yang mengandung teks
      const optionElements = Array.from(
        block.querySelectorAll(".docssharedWizToggleLabeledLabelText, .aDTYp"),
      );
      const optionsText = optionElements.map(
        (el, index) => `${index}. ${el.innerText.trim()}`,
      );

      btn.innerText = "Thinking...";
      btn.disabled = true;

      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // KITA KIRIM DAFTAR OPSI KE AI
          body: JSON.stringify({
            question: qEl ? qEl.innerText.trim() : "",
            options: optionsText,
            prompt:
              "Pilih satu jawaban yang paling tepat dari opsi yang tersedia saja. Berikan jawaban dalam format JSON: { 'answer': 'teks jawaban', 'index': nomor_index_opsi }",
          }),
        });

        const data = await res.json();
        reasonBox.innerHTML = `<strong>AI:</strong> ${data.answer}<br><small>${data.reason || ""}</small>`;
        reasonBox.style.display = "block";

        if (data.index !== undefined || data.answer) {
          let targetOption = null;

          // STRATEGI 1: Gunakan Index (Jika AI mengembalikan index)
          if (data.index !== undefined && optionElements[data.index]) {
            targetOption = optionElements[data.index];
          }
          // STRATEGI 2: Fuzzy Matching (Jika index meleset)
          else {
            const cleanAnswer = data.answer.toLowerCase().trim();
            targetOption = optionElements.find((el) => {
              const txt = el.innerText.toLowerCase().trim();
              return txt.includes(cleanAnswer) || cleanAnswer.includes(txt);
            });
          }

          if (targetOption) {
            // KLIK PADA WRAPPER (Penting untuk Google Forms)
            const radioWrapper = targetOption.closest(
              '[role="radio"], [role="checkbox"], .uMCH9b',
            );
            if (radioWrapper) {
              radioWrapper.click();
              // Simulasi event tambahan agar sistem mendeteksi input
              radioWrapper.dispatchEvent(
                new MouseEvent("mousedown", { bubbles: true }),
              );
              radioWrapper.dispatchEvent(
                new MouseEvent("mouseup", { bubbles: true }),
              );
            } else {
              targetOption.click();
            }
            btn.innerText = "Solved! ✅";
            btn.style.background = "#188038";
          } else {
            btn.innerText = "Option Not Found ⚠️";
            btn.style.background = "#f9ab00";
          }
        }
      } catch (err) {
        btn.innerText = "Error ❌";
        btn.style.background = "#d93025";
      } finally {
        btn.disabled = false;
        setTimeout(() => {
          btn.innerText = "Solve with AI ✨";
          btn.style.background = "#1a73e8";
        }, 3000);
      }
    };

    container.appendChild(btn);
    container.appendChild(reasonBox);
    block.appendChild(container);
  });
}

setInterval(injectAI, 1500);
