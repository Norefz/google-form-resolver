document.addEventListener("DOMContentLoaded", function () {
  const nameEl = document.getElementById("userName");
  const avatarEl = document.getElementById("avatarLetter");

  console.log("🚀 Popup dibuka, mencoba koneksi ke Google Form...");

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs[0] || !tabs[0].url.includes("docs.google.com")) {
      nameEl.innerText = "Buka Google Form";
      console.log("❌ Bukan halaman Google Form");
      return;
    }

    // Minta data ke content.js
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "getUserInfo" },
      function (res) {
        if (chrome.runtime.lastError || !res) {
          nameEl.innerText = "Reload Halaman!";
          return;
        }

        // Update Nama
        nameEl.innerText = res.name;

        // Update Foto atau Inisial
        if (res.avatar && res.avatar !== null) {
          // Jika foto ditemukan
          avatarEl.innerHTML = `<img src="${res.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover; display:block;">`;
          avatarEl.style.background = "transparent";
          avatarEl.innerText = ""; // Hapus tanda tanya/huruf
        } else {
          // Jika foto TIDAK ditemukan, tampilkan inisial (E untuk Erlangga, dll)
          const initial = res.name ? res.name.charAt(0).toUpperCase() : "?";
          avatarEl.innerText = initial;

          // Pilih warna berdasarkan inisial supaya mirip Chrome
          const colors = [
            "#1a73e8",
            "#d93025",
            "#f9ab00",
            "#188038",
            "#e91e63",
          ];
          const colorIndex = initial.charCodeAt(0) % colors.length;
          avatarEl.style.background = colors[colorIndex];
          avatarEl.innerHTML = initial; // Pastikan teks muncul
        }
      },
    );
  });

  // Tombol Solve
  document.getElementById("solveAllBtn").onclick = function () {
    this.disabled = true;
    this.innerText = "Solving... 🚀";
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "solveAll" });
      setTimeout(() => window.close(), 1500);
    });
  };
});
