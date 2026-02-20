document.addEventListener("DOMContentLoaded", function () {
  const nameEl = document.getElementById("userName");
  const avatarEl = document.getElementById("avatarLetter");
  const solveBtn = document.getElementById("solveAllBtn");

  function updateProfile() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) return;

      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "getUserInfo" },
        function (response) {
          if (chrome.runtime.lastError) return; // Menghindari error jika tab belum siap

          if (response) {
            // Format Nama: Huruf depan besar
            const rawName = response.name.replace(/[0-9.]/g, " ").trim();
            const cleanName =
              rawName.charAt(0).toUpperCase() + rawName.slice(1);
            nameEl.innerText = cleanName;

            // Update Foto Profil
            if (response.avatar) {
              avatarEl.innerHTML = `<img src="${response.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover; border: 2px solid #fff;">`;
              avatarEl.style.background = "transparent";
              avatarEl.innerText = ""; // Hapus inisial
            } else {
              avatarEl.innerText = cleanName.charAt(0).toUpperCase();
            }
          }
        },
      );
    });
  }

  // Jalankan update profil
  updateProfile();

  // Tombol Solve All
  solveBtn.addEventListener("click", function () {
    this.disabled = true;
    this.innerText = "Running... 🚀";
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "solveAll" });
      setTimeout(() => window.close(), 1000);
    });
  });
});
