const API_URL = "http://localhost:3000/api/solve";

// --- KONFIGURASI SELECTOR (DISYEDERHANAKAN) ---
const SELECTORS = {
  // Gunakan hanya .geS5n agar tidak mengenai elemen yang bertumpuk
  questionBlock: ".geS5n",
  questionText: '.M7eMe, [role="heading"]',
  optionLabel: ".docssharedWizToggleLabeledLabelText, .aDTYp, .OvPDhc",
  optionClickable:
    '[role="radio"], [role="checkbox"], .docssharedWizToggleLabeledContainer, .uMCH9b, .vd33rc',
  textInput: 'input:not([type="hidden"]), textarea.KHxj8b, textarea.tL9Q4c',
};

function injectAI() {
  const blocks = document.querySelectorAll(SELECTORS.questionBlock);

  blocks.forEach((block) => {
    // 1. PENGECEKAN DATASET (Mencegah proses ulang)
    if (block.dataset.aiInjected === "true") return;

    // 2. PENGECEKAN FISIK (Double Guard)
    // Mencari apakah di dalam blok ini SUDAH ADA container tombol kita
    if (block.querySelector(".ai-solve-container")) {
      block.dataset.aiInjected = "true"; // Tandai agar tidak dicek lagi
      return;
    }

    // Tandai blok sudah diproses
    block.dataset.aiInjected = "true";

    const container = document.createElement("div");
    container.className = "ai-solve-container"; // Class ini penting untuk pengecekan fisik di atas
    container.style =
      "margin-top: 10px; padding: 10px; border-top: 1px dashed #ccc; clear: both;";

    const btn = document.createElement("button");
    btn.innerText = "Solve with AI ✨";
    btn.style =
      "padding: 8px 16px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-family: 'Google Sans', Roboto, Arial, sans-serif;";

    const statusBox = document.createElement("div");
    statusBox.className = "ai-status-box";
    statusBox.style =
      "display: none; margin-top: 8px; font-size: 13px; color: #444; padding: 10px; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #1a73e8;";

    btn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const qEl = block.querySelector(SELECTORS.questionText);
      const question = qEl ? qEl.innerText.trim() : "";
      if (!question) {
        updateStatus(statusBox, "❌ Soal tidak ditemukan", "red");
        return;
      }

      const labelEls = Array.from(
        block.querySelectorAll(SELECTORS.optionLabel),
      );
      const optionsMap = labelEls.map((el, idx) => ({
        index: idx,
        text: el.innerText.trim(),
        element: el,
        cleanText: normalizeText(el.innerText),
      }));

      const optionsForPrompt = optionsMap.map((o) => `${o.index}. ${o.text}`);

      btn.innerText = "Thinking...";
      btn.disabled = true;

      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: question,
            options: optionsForPrompt,
          }),
        });

        const data = await res.json();
        updateStatus(
          statusBox,
          `<strong>AI:</strong> ${data.answer}`,
          "#188038",
        );

        let solved = false;

        // LOGIKA ABC
        if (optionsMap.length > 0) {
          const aiClean = normalizeText(data.answer);
          const match = optionsMap.find((opt) => {
            if (data.index !== undefined && data.index === opt.index)
              return true;
            return (
              opt.cleanText.includes(aiClean) || aiClean.includes(opt.cleanText)
            );
          });

          if (match) {
            const clickable = match.element.closest(SELECTORS.optionClickable);
            simulateClick(clickable || match.element);
            solved = true;
          }
        }
        // LOGIKA URAIAN
        else {
          const inputField = block.querySelector(SELECTORS.textInput);
          if (inputField) {
            inputField.value = data.answer;
            inputField.dispatchEvent(new Event("input", { bubbles: true }));
            inputField.dispatchEvent(new Event("change", { bubbles: true }));
            inputField.focus();
            inputField.blur();
            solved = true;
          }
        }

        btn.innerText = solved ? "Solved! ✅" : "Gagal Klik/Isi ⚠️";
        btn.style.background = solved ? "#188038" : "#f9ab00";
      } catch (err) {
        console.error("AI Error:", err);
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
    container.appendChild(statusBox);

    // Tempelkan tombol di bagian paling bawah blok soal agar konsisten
    block.appendChild(container);
  });
}

// --- FUNGSI BANTUAN (TETAP SAMA) ---
function normalizeText(str) {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function updateStatus(el, html, color) {
  el.innerHTML = html;
  el.style.display = "block";
  el.style.borderLeft = `4px solid ${color}`;
}

function simulateClick(element) {
  element.scrollIntoView({ behavior: "smooth", block: "center" });
  const eventOptions = { bubbles: true, cancelable: true, view: window };
  element.dispatchEvent(new MouseEvent("mousedown", eventOptions));
  element.dispatchEvent(new MouseEvent("mouseup", eventOptions));
  element.dispatchEvent(new MouseEvent("click", eventOptions));
  if (element.tagName === "INPUT") element.checked = true;
}

setInterval(injectAI, 1500);
