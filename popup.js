document.addEventListener("DOMContentLoaded", function () {
  const nameEl = document.getElementById("userName");
  const avatarEl = document.getElementById("avatarLetter");
  const solveBtn = document.getElementById("solveAllBtn");

  // --- ELEMENT BARU UNTUK STATS ---
  const solvedCountEl = document.getElementById("solvedCount");
  const quotaLeftEl = document.getElementById("quotaLeft");
  const quotaProgressEl = document.getElementById("quotaProgress");

  console.log("🚀 Popup opened, connecting to Google Form...");

  // 1. Fungsi untuk Update UI Stats
  function updateStatsUI() {
    chrome.storage.local.get(["ai_stats"], (data) => {
      if (data.ai_stats) {
        const { solved, limit, remaining } = data.ai_stats;

        if (solvedCountEl) solvedCountEl.innerText = solved;
        if (quotaLeftEl) quotaLeftEl.innerText = remaining;

        // Update Progress Bar
        if (quotaProgressEl) {
          const percent = (solved / limit) * 100;
          quotaProgressEl.style.width = Math.min(percent, 100) + "%";
        }

        // Disable tombol jika kuota habis
        if (remaining <= 0 && solveBtn) {
          solveBtn.disabled = true;
          solveBtn.innerText = "Quota Exhausted 🔋";
          solveBtn.style.backgroundColor = "#bdc1c6";
        }
      }
    });
  }

  // Jalankan update stats saat popup dibuka
  updateStatsUI();

  // 2. Ambil tab yang sedang aktif & Info User
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];

    if (!currentTab || !currentTab.url.includes("docs.google.com/forms")) {
      nameEl.innerText = "Buka Google Form dulu";
      if (solveBtn) solveBtn.disabled = true;
      return;
    }

    chrome.tabs.sendMessage(
      currentTab.id,
      { action: "getUserInfo" },
      function (res) {
        if (chrome.runtime.lastError) {
          console.error("❌ Error:", chrome.runtime.lastError.message);
          nameEl.innerText = "Silahkan Refresh Halaman";
          return;
        }

        if (res) {
          nameEl.innerText = res.name || "Google User";

          if (res.avatar && res.avatar !== null) {
            avatarEl.innerText = "";
            avatarEl.style.backgroundImage = `url('${res.avatar}')`;
            avatarEl.style.backgroundSize = "cover";
            avatarEl.style.backgroundPosition = "center";
          } else {
            const initial = res.name ? res.name.charAt(0).toUpperCase() : "?";
            avatarEl.innerText = initial;
            const colors = [
              "#1a73e8",
              "#d93025",
              "#f9ab00",
              "#188038",
              "#e91e63",
              "#8e24aa",
            ];
            const colorIndex = initial.charCodeAt(0) % colors.length;
            avatarEl.style.background = colors[colorIndex];
          }
        }
      },
    );
  });

  // 3. Logika tombol Solve All
  if (solveBtn) {
    solveBtn.onclick = function () {
      // Cek kuota sekali lagi sebelum jalan
      chrome.storage.local.get(["ai_stats"], (data) => {
        const remaining = data.ai_stats?.remaining ?? 50;

        if (remaining <= 0) {
          alert("Daily quota habis! Coba lagi besok.");
          return;
        }

        this.disabled = true;
        this.innerHTML = "Solving... 🚀";

        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            chrome.tabs.sendMessage(
              tabs[0].id,
              { action: "solveAll" },
              function (response) {
                setTimeout(() => {
                  window.close();
                }, 1500);
              },
            );
          },
        );
      });
    };
  }
});
