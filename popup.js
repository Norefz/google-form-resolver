document.addEventListener("DOMContentLoaded", function () {
  const nameEl = document.getElementById("userName");
  const avatarEl = document.getElementById("avatarLetter");

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs[0] || !tabs[0].url.includes("docs.google.com")) {
      nameEl.innerText = "Buka Google Form";
      return;
    }

    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "getUserInfo" },
      function (response) {
        if (chrome.runtime.lastError || !response) {
          nameEl.innerText = "Premium Student"; // Fallback jika gagal
          return;
        }

        // Update Nama
        const cleanName = response.name.replace(/[0-9.]/g, "").trim();
        nameEl.innerText = cleanName || "Student";

        // Update Foto
        if (response.avatar) {
          avatarEl.innerHTML = `<img src="${response.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
          avatarEl.style.background = "transparent";
        } else {
          avatarEl.innerText = (cleanName || "S").charAt(0).toUpperCase();
        }
      },
    );
  });

  document.getElementById("solveAllBtn").onclick = function () {
    this.disabled = true;
    this.innerText = "Solving... 🚀";
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "solveAll" });
    });
  };
});
