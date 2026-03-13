document.addEventListener("DOMContentLoaded", function () {
  const nameEl = document.getElementById("userName");
  const avatarEl = document.getElementById("avatarLetter");
  const solveBtn = document.getElementById("solveAllBtn");

  // --- ELEMENT STATS ---
  const solvedCountEl = document.getElementById("solvedCount");
  const quotaLeftEl = document.getElementById("quotaLeft");
  const quotaProgressEl = document.getElementById("quotaProgress");

  console.log("🚀 Popup opened, connecting to Google Form...");

  // 1. Function to update UI Stats from Storage
  function updateStatsUI() {
    chrome.storage.local.get(["ai_stats"], (data) => {
      if (data.ai_stats) {
        const { solved, limit, remaining } = data.ai_stats;

        if (solvedCountEl) solvedCountEl.innerText = solved;
        if (quotaLeftEl) quotaLeftEl.innerText = remaining;

        // Update Progress Bar smoothly
        if (quotaProgressEl) {
          const percent = (solved / limit) * 100;
          quotaProgressEl.style.width = Math.min(percent, 100) + "%";
        }

        // Handle kondisi kuota habis
        if (remaining <= 0 && solveBtn) {
          solveBtn.disabled = true;
          solveBtn.innerText = "Quota Exhausted 🔋";
          solveBtn.style.backgroundColor = "#bdc1c6";
        }
      }
    });
  }

  updateStatsUI();

  // 2. Get User Info from Content Script
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];

    // Validate if on Google Form
    if (!currentTab || !currentTab.url.includes("docs.google.com/forms")) {
      nameEl.innerText = "Buka Google Form dulu";
      if (solveBtn) solveBtn.disabled = true;
      return;
    }

    // Kirim pesan ke content.js untuk ambil nama & foto
    chrome.tabs.sendMessage(
      currentTab.id,
      { action: "getUserInfo" },
      function (res) {
        if (chrome.runtime.lastError) {
          console.error("❌ Error:", chrome.runtime.lastError.message);
          nameEl.innerText = "Please Refresh Page (F5)";
          return;
        }

        if (res) {
          // Update Nama
          nameEl.innerText = res.name || "Google User";

          // Update Avatar (Gambar vs Inisial)
          if (
            res.avatar &&
            res.avatar !== null &&
            res.avatar.startsWith("http")
          ) {
            avatarEl.innerText = "";
            // Remove background color so image is visible
            avatarEl.style.backgroundImage = `url('${res.avatar}')`;
            avatarEl.style.backgroundSize = "cover";
            avatarEl.style.backgroundPosition = "center";
          } else {
            // Fallback to Initial if no photo
            avatarEl.style.backgroundImage = "none";
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
            avatarEl.style.backgroundColor = colors[colorIndex];
          }
        }
      },
    );
  });

  // 3. Solve All Button Logic
  if (solveBtn) {
    solveBtn.onclick = function () {
      chrome.storage.local.get(["ai_stats"], (data) => {
        const remaining = data.ai_stats?.remaining ?? 50;

        if (remaining <= 0) {
          alert("Daily quota exhausted! Try again tomorrow.");
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
                // Add slight delay before closing popup so user can see status
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
