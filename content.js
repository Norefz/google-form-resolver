const API_URL = "http://localhost:3000/api/solve";

// --- 1. KONFIGURASI SELECTOR ---
// Selector dipertajam agar lebih akurat mencari kotak essay
const SELECTORS = {
  questionBlock: ".geS5n",
  questionText: '.M7eMe, [role="heading"]',
  optionLabel: ".docssharedWizToggleLabeledLabelText, .aDTYp, .OvPDhc",
  optionClickable:
    '[role="radio"], [role="checkbox"], .docssharedWizToggleLabeledContainer, .uMCH9b, .vd33rc',
  textInput: 'textarea, input[type="text"], [role="textbox"]', // Selector lebih luas
};

// --- 2. CSS STYLES ---
const style = document.createElement("style");
style.innerHTML = `
  .ai-global-bar {
    position: fixed; top: 0; left: 0; width: 100%;
    background: #1a73e8; color: white; padding: 12px; z-index: 10000;
    display: none; justify-content: center; align-items: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    font-family: 'Google Sans', Roboto, Arial, sans-serif;
  }
  .ai-global-info { font-weight: bold; display: flex; align-items: center; gap: 10px; }
  .ai-solve-container { margin-top: 10px; padding: 10px; border-top: 1px dashed #ccc; clear: both; }
  .ai-btn-solve { padding: 8px 16px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; }
  .ai-status-box { display: none; margin-top: 8px; font-size: 13px; color: #444; padding: 10px; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #1a73e8; }
`;
document.head.appendChild(style);

// --- 3. FITUR HUMAN-LIKE MIMICRY (VERSI AMPUH) ---

async function typeLikeHuman(element, text) {
  if (!element) return;

  element.focus();
  element.click(); // Pastikan benar-benar fokus

  // Gunakan execCommand untuk "menyuntikkan" teks seperti diketik asli
  // Ini trik paling jitu buat nembus Google Forms
  try {
    document.execCommand("insertText", false, text);
  } catch (e) {
    // Fallback jika execCommand gagal
    element.value = text;
  }

  // Trigger event agar sistem Google sadar ada input
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 100));
  element.blur();
}

async function simulateHumanClick(el) {
  if (!el) return;
  const opts = { bubbles: true, cancelable: true, view: window };
  el.dispatchEvent(new MouseEvent("mouseenter", opts));
  await new Promise((r) => setTimeout(r, 150));
  el.dispatchEvent(new MouseEvent("click", opts));
}

// --- 4. FUNGSI UTAMA: SOLVE ALL ---
async function solveAllQuestions() {
  const globalBar = document.querySelector(".ai-global-bar");
  const infoText = document.querySelector(".ai-global-info");
  const allButtons = Array.from(document.querySelectorAll(".ai-btn-solve"));

  if (allButtons.length === 0) return;

  globalBar.style.display = "flex";
  document.body.style.marginTop = "50px";

  for (let i = 0; i < allButtons.length; i++) {
    const btn = allButtons[i];
    if (btn.innerText.includes("✅") || btn.disabled) continue;

    infoText.innerText = `Solving: ${i + 1} / ${allButtons.length} Questions... ⏳`;
    btn.scrollIntoView({ behavior: "smooth", block: "center" });

    const randomWait = Math.floor(Math.random() * 2000) + 2000;
    await new Promise((resolve) => setTimeout(resolve, randomWait));

    btn.click();
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }

  infoText.innerText = "All Problems Solved! ✨";
  setTimeout(() => {
    globalBar.style.display = "none";
    document.body.style.marginTop = "0px";
  }, 3000);
}

// --- 5. INJEKSI TOMBOL PER SOAL ---
function injectAI() {
  const blocks = document.querySelectorAll(SELECTORS.questionBlock);
  blocks.forEach((block) => {
    if (block.dataset.aiInjected === "true") return;
    block.dataset.aiInjected = "true";

    const container = document.createElement("div");
    container.className = "ai-solve-container";

    const btn = document.createElement("button");
    btn.className = "ai-btn-solve";
    btn.innerText = "Solve with AI ✨";

    const statusBox = document.createElement("div");
    statusBox.className = "ai-status-box";

    btn.onclick = async (e) => {
      e.preventDefault();
      const qEl = block.querySelector(SELECTORS.questionText);
      const question = qEl ? qEl.innerText.trim() : "";
      const labelEls = Array.from(
        block.querySelectorAll(SELECTORS.optionLabel),
      );
      const optionsForPrompt = labelEls.map(
        (el, idx) => `${idx}. ${el.innerText.trim()}`,
      );

      btn.innerText = "Thinking...";
      btn.disabled = true;

      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, options: optionsForPrompt }),
        });
        const data = await res.json();

        statusBox.innerHTML = `<strong>AI:</strong> ${data.answer}`;
        statusBox.style.display = "block";

        let solved = false;

        // Cek Pilihan Ganda
        if (labelEls.length > 0) {
          const aiClean = normalizeText(data.answer);
          const match = labelEls.find(
            (el) =>
              normalizeText(el.innerText).includes(aiClean) ||
              aiClean.includes(normalizeText(el.innerText)),
          );
          if (match) {
            await simulateHumanClick(
              match.closest(SELECTORS.optionClickable) || match,
            );
            solved = true;
          }
        }
        // Cek Essay / Uraian
        else {
          const input = block.querySelector(SELECTORS.textInput);
          if (input) {
            await typeLikeHuman(input, data.answer);
            solved = true;
          }
        }

        btn.innerText = solved ? "Solved! ✅" : "Manual Check ⚠️";
        btn.style.background = solved ? "#188038" : "#f9ab00";
      } catch (err) {
        btn.innerText = "Error ❌";
      } finally {
        btn.disabled = false;
      }
    };

    container.appendChild(btn);
    container.appendChild(statusBox);
    block.appendChild(container);
  });
}

// --- 6. UTILS ---
function normalizeText(str) {
  return str ? str.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
}

function createGlobalBar() {
  if (document.querySelector(".ai-global-bar")) return;
  const bar = document.createElement("div");
  bar.className = "ai-global-bar";
  bar.innerHTML = `<div class="ai-global-info">Preparing AI... 🤖</div>`;
  document.body.appendChild(bar);
}

// --- 7. LISTENERS ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "solveAll") {
    solveAllQuestions();
    sendResponse({ status: "started" });
  }
  return true;
});

setInterval(injectAI, 1500);
createGlobalBar();
