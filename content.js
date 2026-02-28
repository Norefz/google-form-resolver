const API_URL = "http://localhost:3000/api/solve";
const STATS_URL = "http://localhost:3000/api/stats";

// --- 1. KONFIGURASI SELECTOR ---
const SELECTORS = {
  questionBlock: ".geS5n",
  questionText: '.M7eMe, [role="heading"]',
  optionLabel: ".docssharedWizToggleLabeledLabelText, .aDTYp, .OvPDhc",
  optionClickable:
    '[role="radio"], [role="checkbox"], .docssharedWizToggleLabeledContainer, .uMCH9b, .vd33rc',
  textInput: 'textarea, input[type="text"], [role="textbox"]',
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

// --- 3. STATS MANAGER (NEW: UNTUK TRACKING QUOTA) ---
const StatsManager = {
  async getStats() {
    try {
      const data = await chrome.storage.local.get(["ai_stats"]);
      return data.ai_stats || { solved: 0, limit: 50, remaining: 50 };
    } catch (e) {
      return { solved: 0, limit: 50, remaining: 50 };
    }
  },

  async syncWithServer() {
    try {
      const res = await fetch(STATS_URL);
      const serverData = await res.json();
      // Simpan data dari server ke storage lokal chrome
      const stats = {
        solved: serverData.solved,
        limit: serverData.limit,
        remaining: serverData.remaining,
        date: new Date().toDateString(),
      };
      await chrome.storage.local.set({ ai_stats: stats });
      return stats;
    } catch (err) {
      console.error("Gagal sinkronisasi stats:", err);
      return await this.getStats();
    }
  },
};

// --- 4. HUMAN-LIKE MIMICRY ---
async function typeLikeHuman(element, text) {
  if (!element) return;
  element.focus();
  element.click();
  try {
    document.execCommand("insertText", false, text);
  } catch (e) {
    element.value = text;
  }
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 100));
}

async function simulateHumanClick(el) {
  if (!el) return;
  const opts = { bubbles: true, cancelable: true, view: window };
  el.dispatchEvent(new MouseEvent("mouseenter", opts));
  await new Promise((r) => setTimeout(r, 150));
  el.dispatchEvent(new MouseEvent("click", opts));
}

// --- 5. FUNGSI UTAMA: SOLVE ALL ---
async function solveAllQuestions() {
  const globalBar = document.querySelector(".ai-global-bar");
  const infoText = document.querySelector(".ai-global-info");
  const allButtons = Array.from(document.querySelectorAll(".ai-btn-solve"));

  if (allButtons.length === 0) return;

  globalBar.style.display = "flex";

  for (let i = 0; i < allButtons.length; i++) {
    const btn = allButtons[i];
    if (btn.innerText.includes("✅") || btn.disabled) continue;

    const stats = await StatsManager.getStats();
    if (stats.remaining <= 0) {
      infoText.innerText = "Quota Limit Reached! 🛑";
      break;
    }

    infoText.innerText = `Solving: ${i + 1} / ${allButtons.length} Questions... ⏳`;
    btn.scrollIntoView({ behavior: "smooth", block: "center" });

    const randomWait = Math.floor(Math.random() * 2000) + 1500;
    await new Promise((resolve) => setTimeout(resolve, randomWait));

    btn.click();
    // Tunggu proses per soal selesai
    await new Promise((resolve) => setTimeout(resolve, 4500));
  }

  infoText.innerText = "Process Finished! ✨";
  setTimeout(() => {
    globalBar.style.display = "none";
  }, 3000);
}

// --- 6. INJEKSI TOMBOL PER SOAL ---
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

      // Cek Kuota dulu
      const stats = await StatsManager.getStats();
      if (stats.remaining <= 0) {
        statusBox.innerHTML =
          "<strong style='color:red'>Quota Habis!</strong> Coba lagi besok.";
        statusBox.style.display = "block";
        return;
      }

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
            await simulateHumanClick(
              match.closest(SELECTORS.optionClickable) || match,
            );
            solved = true;
          }
        } else {
          const input = block.querySelector(SELECTORS.textInput);
          if (input) {
            await typeLikeHuman(input, data.answer);
            solved = true;
          }
        }

        if (solved) {
          await StatsManager.syncWithServer(); // Sinkronkan kuota setelah sukses
          btn.innerText = "Solved! ✅";
          btn.style.background = "#188038";
        } else {
          btn.innerText = "Manual Check ⚠️";
          btn.style.background = "#f9ab00";
          btn.disabled = false;
        }
      } catch (err) {
        btn.innerText = "Error ❌";
        btn.disabled = false;
      }
    };

    container.appendChild(btn);
    container.appendChild(statusBox);
    block.appendChild(container);
  });
}

// --- 7. UTILS ---
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

// --- 8. LISTENERS (FULL VERSION: ANTI-NULL & INITIALS) ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "solveAll") {
    solveAllQuestions();
    sendResponse({ status: "started" });
  } else if (request.action === "getUserInfo") {
    // 1. CARI IDENTITAS DI BERBAGAI TITIK (Agresif)
    // Cek Header Form (ahS4be), Profil Kanan Atas (gb_A), dan teks halaman
    const headerIdentity = document.querySelector(".ahS4be")?.innerText || "";
    const profileBtn =
      document.querySelector(".gb_A") ||
      document.querySelector('[aria-label*="Google Account"]');
    const profileAttr = profileBtn
      ? profileBtn.getAttribute("aria-label") || profileBtn.title
      : "";

    // 2. SCAN EMAIL MENGGUNAKAN REGEX
    // Kita gabungkan semua sumber teks untuk mencari alamat @gmail.com
    const combinedText =
      headerIdentity + " " + profileAttr + " " + document.body.innerText;
    const emailMatch = combinedText.match(/[a-zA-Z0-9._%+-]+@gmail\.com/);
    const userEmail = emailMatch ? emailMatch[0] : null;

    // 3. LOGIKA EKSTRAKSI NAMA (Email Prefix -> Initial)
    let finalName = "Google User";

    if (userEmail) {
      // Ambil bagian depan email: misal 'erlan.project@gmail.com'
      // Kita potong berdasarkan '@', lalu '.' atau '_'
      let prefix = userEmail.split("@")[0].split(".")[0].split("_")[0];
      finalName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    } else if (headerIdentity && headerIdentity.length < 50) {
      // Jika email gak ketemu tapi ada teks pendek di header, ambil itu
      finalName = headerIdentity.split("\n")[0].trim();
    }

    // 4. CARI AVATAR (FOTO PROFIL)
    const imgSelectors = [
      "img.gb_A",
      ".VvE39b img",
      ".gb_d img",
      'img[src*="googleusercontent.com"]',
    ];
    let foundAvatar = null;
    for (let sel of imgSelectors) {
      const img = document.querySelector(sel);
      if (img && img.src && !img.src.includes("clear.gif")) {
        foundAvatar = img.src;
        break;
      }
    }

    // 5. DEBUGGING (Lihat di Console F12)
    console.log("🚀 Profile Scan Result:", {
      email: userEmail,
      name: finalName,
      avatarFound: !!foundAvatar,
    });

    sendResponse({ name: finalName, avatar: foundAvatar });
  } else if (request.action === "getStats") {
    // Sinkronisasi data kuota ke popup
    StatsManager.getStats().then((stats) => {
      sendResponse({ stats });
    });
    return true;
  }

  return true; // Channel tetap terbuka untuk async response
});

setInterval(injectAI, 1500);
createGlobalBar();
// Sinkron data pertama kali saat halaman dimuat
StatsManager.syncWithServer();
