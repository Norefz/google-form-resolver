const API_URL = "http://localhost:3000/api/solve";

function injectAI() {
  // Gunakan selector yang lebih spesifik untuk "kotak soal" Google Forms
  // Kita pilih elemen .geS5n saja karena itu adalah kontainer utama per soal
  const blocks = document.querySelectorAll(".geS5n");

  blocks.forEach((block) => {
    // 1. CEK ANTI-DUPLIKASI (Dataset diletakkan di elemen soal utama)
    if (block.dataset.aiInjected === "true") return;
    block.dataset.aiInjected = "true";

    // 2. CEK APAKAH TOMBOL SUDAH ADA (Double Check secara fisik)
    if (block.querySelector(".ai-solve-container")) return;

    const container = document.createElement("div");
    container.className = "ai-solve-container";
    container.style =
      "margin-top: 15px; padding: 10px 0; border-top: 1px dashed #dadce0; width: 100%;";

    const btn = document.createElement("button");
    btn.innerText = "Solve with AI ✨";
    btn.style =
      "padding: 10px 20px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; font-family: 'Google Sans', Roboto, Arial; font-size: 14px; box-shadow: 0 1px 3px rgba(60,64,67,0.3); transition: background 0.2s;";

    const reasonBox = document.createElement("div");
    reasonBox.className = "ai-reason-box";
    reasonBox.style =
      "display: none; margin-top: 10px; padding: 12px; background: #f8f9fa; border-radius: 8px; font-size: 13px; line-height: 1.5; color: #3c4043; border: 1px solid #dadce0;";

    btn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Temukan Pertanyaan (Spesifik Google Forms)
      const qEl = block.querySelector(".M7eMe");

      // Temukan Opsi (Elemen yang memuat teks jawaban)
      const optionRows = Array.from(
        block.querySelectorAll(".docssharedWizToggleLabeledLabelText, .aDTYp"),
      );
      const optionsText = optionRows
        .map((el) => el.innerText.trim())
        .filter((t) => t !== "");

      const textInput = block.querySelector('input[type="text"], textarea');

      btn.innerText = "Thinking...";
      btn.disabled = true;

      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: qEl ? qEl.innerText.trim() : "Question not found",
            options: optionsText,
          }),
        });

        const data = await res.json();

        reasonBox.innerHTML = `<div style="margin-bottom:5px; color:#188038; font-weight:bold;">AI Result: ${data.answer}</div><div style="color:#5f6368; font-style:italic;">${data.reason}</div>`;
        reasonBox.style.display = "block";

        if (data.type === "multiple") {
          let clicked = false;
          // Bersihkan jawaban AI dari karakter aneh dan ambil intinya
          const aiAnswer = data.answer.toLowerCase().trim();

          for (let row of optionRows) {
            const rowText = row.innerText.toLowerCase().trim();

            // LOGIKA PENCOCOKAN:
            // 1. Cek apakah teks opsi mengandung jawaban AI (misal: "B. 1 Juni" mengandung "1 Juni")
            // 2. Cek apakah jawaban AI mengandung teks opsi
            if (rowText.includes(aiAnswer) || aiAnswer.includes(rowText)) {
              // TARGET KLIK: Kita cari elemen yang bisa diklik (role radio)
              const clickable =
                row.closest('[role="radio"], [role="checkbox"], .uMCH9b') ||
                row;

              console.log("Mencoba klik:", rowText);

              // Lakukan simulasi klik manusia secara lengkap
              clickable.click();
              clickable.dispatchEvent(
                new MouseEvent("mousedown", { bubbles: true }),
              );
              clickable.dispatchEvent(
                new MouseEvent("mouseup", { bubbles: true }),
              );

              clicked = true;
              break;
            }
          }

          if (!clicked) {
            btn.innerText = "Match Failed ⚠️";
            btn.style.background = "#f9ab00";
          } else {
            btn.innerText = "Solved! ✅";
            btn.style.background = "#188038";
          }
        }
      } catch (err) {
        btn.innerText = "Error ❌";
        btn.style.background = "#d93025";
      } finally {
        btn.disabled = false;
        setTimeout(() => {
          btn.innerText = "Solve with AI ✨";
          btn.style.background = "#1a73e8";
        }, 4000);
      }
    };

    container.appendChild(btn);
    container.appendChild(reasonBox);

    // MASUKKAN KE DALAM BLOK (Pastikan hanya satu tempat)
    // .geS5n adalah wrapper utama soal di Google Forms
    block.appendChild(container);
  });
}

// Jalankan injeksi
setInterval(injectAI, 1500);
