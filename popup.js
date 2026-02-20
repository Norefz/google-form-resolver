document.addEventListener("DOMContentLoaded", function () {
  const solveBtn = document.getElementById("solveAllBtn");
  const nameEl = document.getElementById("userName");
  const avatarEl = document.getElementById("avatarLetter");

  // Ambil info user dari halaman aktif
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0]) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "getUserInfo" },
        function (response) {
          if (response && response.name) {
            const cleanName = response.name
              .split("@")[0]
              .replace(/[0-9.]/g, " ")
              .trim();
            nameEl.innerText = cleanName;
            avatarEl.innerText = cleanName.charAt(0).toUpperCase();
          } else {
            nameEl.innerText = "Guest User";
            avatarEl.innerText = "G";
          }
        },
      );
    }
  });

  // Event klik Solve All
  solveBtn.addEventListener("click", function () {
    solveBtn.disabled = true;
    solveBtn.innerText = "Working on it...";

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "solveAll" },
          function (response) {
            // Tutup popup agar user bisa melihat prosesnya di layar
            setTimeout(() => window.close(), 500);
          },
        );
      }
    });
  });
});
