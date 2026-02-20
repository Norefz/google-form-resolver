const API_URL = "http://localhost:3000/api/solve";

// --- KONFIGURASI SELECTOR ---
const SELECTORS = {
  questionBlock: ".geS5n",
  questionText: '.M7eMe, [role="heading"]',
  optionLabel: ".docssharedWizToggleLabeledLabelText, .aDTYp, .OvPDhc",
  optionClickable:
    '[role="radio"], [role="checkbox"], .docssharedWizToggleLabeledContainer, .uMCH9b, .vd33rc',
  textInput: 'input:not([type="hidden"]), textarea.KHxj8b, textarea.tL9Q4c',
};

// --- STATE GLOBAL ---
let isSolvingAll = false;

// --- CSS STYLES ---
const style = document.createElement("style");
style.innerHTML = `
  .ai-global-bar {
    position: fixed;
    top: 0; left: 0; width: 100%;
    background: #1a73e8; color: white;
    padding: 12px; z-index: 10000;
    display: flex; justify-content: center; align-items: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    font-family: 'Google Sans', Roboto, Arial, sans-serif;
    transition: all 0.3s ease;
  }
  .ai-global-btn {
    background: #ffffff; color: #1a73e8;
    border: none; padding: 6px 18px;
    border-radius: 20px; cursor: pointer;
    font-weight: bold; margin-left: 15px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  .ai-global-btn:hover { background: #f1f3f4; }
  .ai-global-btn:disabled { background: #bdc1c6; color: #70757a; cursor: not-allowed; }
  
  /* Geser body sedikit ke bawah agar tidak tertutup bar */
  body { margin-top: 50px !important; }
`;
document.head.appendChild(style);

// --- FUNGSI UTAMA: SOLVE ALL ---
async function solveAllQuestions() {
  if (isSolvingAll) return;

  const allButtons = Array.from(
    document.querySelectorAll(".ai-solve-container button"),
  );
  if (allButtons.length === 0) {
    alert(
      "Belum ada tombol 'Solve with AI' yang terdeteksi. Tunggu sebentar atau scroll ke bawah.",
    );
    return;
  }

  const globalBtn = document.querySelector(".ai-global-btn");
  isSolvingAll = true;
  globalBtn.disabled = true;

  for (let i = 0; i < allButtons.length; i++) {
    const btn = allButtons[i];

    // Jangan klik lagi jika sudah solved
    if (btn.innerText.includes("✅")) continue;

    globalBtn.innerText = `Solving Soal ${i + 1}/${allButtons.length}... ⏳`;

    // Scroll ke soal agar terlihat (membantu stabilitas klik)
    btn.scrollIntoView({ behavior: "smooth", block: "center" });

    // Trigger klik pada tombol individu
    btn.click();

    // Beri jeda 2.5 detik per soal (agar tidak kena limit API/Rate Limit)
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  globalBtn.innerText = "All Solved! ✨";
  globalBtn.style.background = "#34a853";
  globalBtn.style.color = "white";
  isSolvingAll = false;

  setTimeout(() => {
    globalBtn.innerText = "Solve All Problems ✨";
    globalBtn.style.background = "white";
    globalBtn.style.color = "#1a73e8";
    globalBtn.disabled = false;
  }, 5000);
}

// --- FUNGSI INJEKSI TOMBOL PER SOAL ---
function injectAI() {
  const blocks = document.querySelectorAll(SELECTORS.questionBlock);

  blocks.forEach((block) => {
    if (block.dataset.aiInjected === "true") return;
    if (block.querySelector(".ai-solve-container")) {
      block.dataset.aiInjected = "true";
      return;
    }

    block.dataset.aiInjected = "true";

    const container = document.createElement("div");
    container.className = "ai-solve-container";
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
          if (!btn.innerText.includes("✅")) {
            btn.innerText = "Solve with AI ✨";
            btn.style.background = "#1a73e8";
          }
        }, 3000);
      }
    };

    container.appendChild(btn);
    container.appendChild(statusBox);
    block.appendChild(container);
  });
}

// --- FUNGSI UI GLOBAL BAR ---
function createGlobalBar() {
  if (document.querySelector(".ai-global-bar")) return;

  const bar = document.createElement("div");
  bar.className = "ai-global-bar";
  bar.innerHTML = `
    <span>AI Assistant Active 🤖</span>
    <button class="ai-global-btn">Solve All Problems ✨</button>
  `;

  document.body.appendChild(bar);
  bar.querySelector(".ai-global-btn").onclick = solveAllQuestions;
}

// --- FUNGSI BANTUAN ---
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

// --- INISIALISASI ---
setInterval(injectAI, 1500);
createGlobalBar();
