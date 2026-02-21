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

// --- CSS STYLES ---
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
`;
document.head.appendChild(style);

// --- FUNGSI UTAMA: SOLVE ALL ---
async function solveAllQuestions() {
  const globalBar = document.querySelector(".ai-global-bar");
  const infoText = document.querySelector(".ai-global-info");
  const allButtons = Array.from(
    document.querySelectorAll(".ai-solve-container button"),
  );

  if (allButtons.length === 0) return;

  globalBar.style.display = "flex";
  document.body.style.marginTop = "50px";

  for (let i = 0; i < allButtons.length; i++) {
    const btn = allButtons[i];
    if (btn.innerText.includes("✅")) continue;

    infoText.innerText = `Solving: ${i + 1} / ${allButtons.length} Questions... ⏳`;
    btn.scrollIntoView({ behavior: "smooth", block: "center" });
    btn.click();
    await new Promise((resolve) => setTimeout(resolve, 2100));
  }

  infoText.innerText = "All Problems Solved! ✨";
  setTimeout(() => {
    globalBar.style.display = "none";
    document.body.style.marginTop = "0px";
  }, 3000);
}

// --- FUNGSI INJEKSI TOMBOL PER SOAL ---
function injectAI() {
  const blocks = document.querySelectorAll(SELECTORS.questionBlock);
  blocks.forEach((block) => {
    if (block.dataset.aiInjected === "true") return;
    block.dataset.aiInjected = "true";

    const container = document.createElement("div");
    container.className = "ai-solve-container";
    container.style =
      "margin-top: 10px; padding: 10px; border-top: 1px dashed #ccc; clear: both;";

    const btn = document.createElement("button");
    btn.innerText = "Solve with AI ✨";
    btn.style =
      "padding: 8px 16px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;";

    const statusBox = document.createElement("div");
    statusBox.style =
      "display: none; margin-top: 8px; font-size: 13px; color: #444; padding: 10px; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #1a73e8;";

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
        if (labelEls.length > 0) {
          const aiClean = normalizeText(data.answer);
          const match = labelEls.find(
            (el) =>
              normalizeText(el.innerText).includes(aiClean) ||
              aiClean.includes(normalizeText(el.innerText)),
          );
          if (match) {
            simulateClick(match.closest(SELECTORS.optionClickable) || match);
            solved = true;
          }
        } else {
          const input = block.querySelector(SELECTORS.textInput);
          if (input) {
            input.value = data.answer;
            input.dispatchEvent(new Event("input", { bubbles: true }));
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

// --- FUNGSI PROFIL & UI ---
function createGlobalBar() {
  if (document.querySelector(".ai-global-bar")) return;
  const bar = document.createElement("div");
  bar.className = "ai-global-bar";
  bar.innerHTML = `<div class="ai-global-info">Preparing AI... 🤖</div>`;
  document.body.appendChild(bar);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "solveAll") {
    solveAllQuestions();
    sendResponse({ status: "started" });
  }

  if (request.action === "getUserInfo") {
    let finalName = "";
    let avatarUrl = null;

    console.log("--- DEBUG START ---");

    try {
      // 1. CARI SEMUA IMG DI HALAMAN
      const allImages = document.querySelectorAll("img");
      console.log(`Total gambar ditemukan di page: ${allImages.length}`);

      for (let img of allImages) {
        // Cek apakah src mengandung kata kunci profil Google
        if (
          img.src &&
          (img.src.includes("googleusercontent.com") ||
            img.src.includes("lh3.googleusercontent.com"))
        ) {
          console.log("✅ KETEMU Kandidat Foto:", img.src);
          avatarUrl = img.src.replace(/=s\d+(-c)?/, "=s120-c");
          break;
        }
      }

      // 2. JIKA MASIH KOSONG, CEK BACKGROUND-IMAGE
      if (!avatarUrl) {
        console.log(
          "⚠️ Foto tidak ketemu di tag <img>, mencari di background-image...",
        );
        const bgElements = document.querySelectorAll(
          'a[href*="SignOutOptions"], .gb_A, .gb_i',
        );
        bgElements.forEach((el, i) => {
          const bg = window.getComputedStyle(el).backgroundImage;
          console.log(`Elemen profil ${i} BG:`, bg);
          if (bg && bg.includes("googleusercontent.com")) {
            const match = bg.match(/url\(["']?(.*?)["']?\)/);
            if (match) {
              avatarUrl = match[1].replace(/=s\d+(-c)?/, "=s120-c");
              console.log("✅ KETEMU Foto dari BG CSS:", avatarUrl);
            }
          }
        });
      }

      // 3. CARI NAMA (Logika yang sudah jalan)
      const accountBtn = document.querySelector(
        'a[href*="SignOutOptions"], [aria-label*="Google"], [aria-label*="Akun"]',
      );
      if (accountBtn) {
        const label = accountBtn.getAttribute("aria-label");
        console.log("Aria-label akun:", label);
        const match = label.match(
          /(?:Account|Google|Akun)[^:]*:\s*(.*?)\s*\(/i,
        );
        if (match) finalName = match[1].trim();
      }

      if (!finalName) {
        console.log("⚠️ Nama tidak ketemu di header, cari di text @...");
        const emailEl = Array.from(document.querySelectorAll("span, div")).find(
          (el) => el.innerText.includes("@") && !el.innerText.includes(" "),
        );
        if (emailEl) finalName = emailEl.innerText.split("@")[0];
      }
    } catch (error) {
      console.error("❌ ERROR SCRAPING:", error);
    }

    console.log("--- DEBUG END: Hasil Akhir ---", {
      name: finalName,
      avatar: avatarUrl,
    });

    sendResponse({ name: finalName || "Student", avatar: avatarUrl });
  }
  return true;
});
function normalizeText(str) {
  return str ? str.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
}

function simulateClick(el) {
  const opts = { bubbles: true, cancelable: true, view: window };
  el.dispatchEvent(new MouseEvent("mousedown", opts));
  el.dispatchEvent(new MouseEvent("mouseup", opts));
  el.dispatchEvent(new MouseEvent("click", opts));
}

setInterval(injectAI, 1500);
createGlobalBar();
