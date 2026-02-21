document.addEventListener("DOMContentLoaded", function () {
  const nameEl = document.getElementById("userName");
  const avatarEl = document.getElementById("avatarLetter");
  const solveBtn = document.getElementById("solveAllBtn");

  console.log("🚀 Popup opened, connecting to Google Form...");

  // 1. Ambil tab yang sedang aktif
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];

    // Cek apakah user sedang membuka Google Form
    if (!currentTab || !currentTab.url.includes("docs.google.com/forms")) {
      nameEl.innerText = "Buka Google Form dulu";
      if (solveBtn) solveBtn.disabled = true;
      return;
    }

    // 2. Minta data User (Nama & Avatar) ke content.js
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
          console.log("✅ Data received in popup:", res);

          // Render Nama
          nameEl.innerText = res.name || "Google User";

          // Render Avatar (Foto atau Inisial)
          if (res.avatar && res.avatar !== null) {
            // Jika foto profil ditemukan: Pasang sebagai Background agar rapi (cover)
            avatarEl.innerText = ""; // Hapus teks "?" atau inisial
            avatarEl.style.backgroundImage = `url('${res.avatar}')`;
            avatarEl.style.backgroundSize = "cover";
            avatarEl.style.backgroundPosition = "center";
            avatarEl.style.border = "2px solid #fff";
          } else {
            // Jika foto profil TIDAK ditemukan: Tampilkan inisial huruf
            const initial = res.name ? res.name.charAt(0).toUpperCase() : "?";
            avatarEl.innerText = initial;
            avatarEl.style.backgroundImage = "none";

            // Beri warna background berdasarkan huruf (biar variatif)
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
      this.disabled = true;
      const originalText = this.innerHTML;
      this.innerHTML = "Solving... 🚀";

      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "solveAll" },
          function (response) {
            // Popup ditutup otomatis setelah 1 detik agar user bisa lihat prosesnya
            setTimeout(() => {
              window.close();
            }, 1000);
          },
        );
      });
    };
  }
});
