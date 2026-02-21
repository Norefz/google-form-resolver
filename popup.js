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
        if (chrome.runtime.lastError) {
          console.error(
            "❌ Gagal terhubung ke content.js:",
            chrome.runtime.lastError.message,
          );
          nameEl.innerText = "Reload Halaman!"; // Pesan error UI
          return;
        }

        if (!res) {
          console.warn("⚠️ Data kosong dari content.js");
          return;
        }

        console.log("✅ Data diterima di popup:", res);

        // Render Nama
        nameEl.innerText = res.name;

        // Render Foto atau Inisial
        if (res.avatar) {
          avatarEl.innerHTML = `<img src="${res.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
          avatarEl.style.background = "transparent";
        } else {
          avatarEl.innerText = res.name.charAt(0).toUpperCase();
          avatarEl.style.background = "#e91e63"; // Warna pink default
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
