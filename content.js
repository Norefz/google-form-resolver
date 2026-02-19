const API_URL = "http://localhost:3000/api/solve";

// --- KONFIGURASI SELECTOR (AGAR MUDAH DISESUAIKAN) ---
const SELECTORS = {
  // Selector blok soal (kontainer utama)
  questionBlock: '.geS5n, div[role="listitem"]',

  // Selector teks pertanyaan
  questionText: '.M7eMe, [role="heading"]',

  // Selector Opsi ABC (Label teksnya)
  optionLabel: ".docssharedWizToggleLabeledLabelText, .aDTYp, .OvPDhc",

  // Selector Wadah Klik ABC (PENTING: Ini target klik sebenarnya)
  // Mencari elemen dengan role radio/checkbox atau class container Google Forms
  optionClickable:
    '[role="radio"], [role="checkbox"], .docssharedWizToggleLabeledContainer, .uMCH9b, .vd33rc',

  // Selector Input Uraian (Text/Textarea)
  // Kita cari input yang terlihat (bukan hidden) dan textarea
  textInput: 'input:not([type="hidden"]), textarea.KHxj8b, textarea.tL9Q4c',
};

function injectAI() {
  const blocks = document.querySelectorAll(SELECTORS.questionBlock);

  blocks.forEach((block) => {
    // Cek anti-duplikat
    if (block.dataset.aiInjected === "true") return;
    block.dataset.aiInjected = "true";

    // --- UI TOMBOL ---
    const container = document.createElement("div");
    container.className = "ai-solve-container";
    container.style =
      "margin-top: 10px; padding: 10px; border-top: 1px dashed #ccc; clear: both;";

    const btn = document.createElement("button");
    btn.innerText = "Solve with AI ✨";
    btn.style =
      "padding: 8px 16px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;";

    const statusBox = document.createElement("div");
    statusBox.style =
      "display: none; margin-top: 8px; font-size: 13px; color: #444; padding: 5px; background: #f1f3f4; border-radius: 4px;";

    btn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // 1. AMBIL PERTANYAAN
      const qEl = block.querySelector(SELECTORS.questionText);
      const question = qEl ? qEl.innerText.trim() : "";
      if (!question) {
        updateStatus(statusBox, "❌ Soal tidak ditemukan", "red");
        return;
      }

      // 2. AMBIL OPSI (Mapping Teks ke Elemen)
      const labelEls = Array.from(
        block.querySelectorAll(SELECTORS.optionLabel),
      );
      const optionsMap = labelEls.map((el, idx) => ({
        index: idx,
        text: el.innerText.trim(), // Teks asli di layar
        element: el,
        cleanText: normalizeText(el.innerText), // Teks bersih untuk pencocokan
      }));

      // Format opsi untuk dikirim ke AI
      const optionsForPrompt = optionsMap.map((o) => `${o.index}. ${o.text}`);

      btn.innerText = "Thinking...";
      btn.disabled = true;

      try {
        // 3. KIRIM KE AI
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: question,
            options: optionsForPrompt,
          }),
        });

        const data = await res.json();

        // Tampilkan Jawaban AI
        updateStatus(
          statusBox,
          `<strong>AI:</strong> ${data.answer}`,
          "#188038",
        );

        // 4. EKSEKUSI PENGISIAN (LOGIC BARU)
        let solved = false;

        // --- KASUS A: PILIHAN GANDA (ABC) ---
        if (optionsMap.length > 0) {
          const aiClean = normalizeText(data.answer);

          // Mencari kecocokan
          const match = optionsMap.find((opt) => {
            // Cek 1: Index cocok (kalau AI kirim index)
            if (data.index !== undefined && data.index === opt.index)
              return true;
            // Cek 2: Teks mengandung jawaban AI (Fuzzy)
            return (
              opt.cleanText.includes(aiClean) || aiClean.includes(opt.cleanText)
            );
          });

          if (match) {
            console.log("🎯 Match Found:", match.text);
            // CARI ELEMENT YANG BISA DIKLIK (PARENT/WRAPPER)
            // Kita naik ke atas (closest) cari 'role="radio"'
            const clickable = match.element.closest(SELECTORS.optionClickable);

            if (clickable) {
              simulateClick(clickable); // Gunakan fungsi klik sakti
            } else {
              // Fallback: klik labelnya langsung kalau wrapper ga ketemu
              simulateClick(match.element);
            }
            solved = true;
          }
        }

        // --- KASUS B: URAIAN (TEXT INPUT) ---
        else {
          // Cari input apapun yang ada di blok soal ini
          const inputField = block.querySelector(SELECTORS.textInput);

          if (inputField) {
            console.log("✍️ Typing in:", inputField);
            inputField.value = data.answer;
            inputField.dispatchEvent(new Event("input", { bubbles: true }));
            inputField.dispatchEvent(new Event("change", { bubbles: true }));
            // Fokus dan Blur kadang diperlukan trigger validasi
            inputField.focus();
            inputField.blur();
            solved = true;
          } else {
            console.log("❌ Input field not found in block");
          }
        }

        // Update Tombol
        if (solved) {
          btn.innerText = "Solved! ✅";
          btn.style.background = "#188038";
        } else {
          btn.innerText = "Gagal Klik/Isi ⚠️";
          btn.style.background = "#f9ab00";
        }
      } catch (err) {
        console.error("AI Error:", err);
        btn.innerText = "Error ❌";
        btn.style.background = "#d93025";
      } finally {
        btn.disabled = false;
        setTimeout(() => {
          btn.innerText = "Solve with AI ✨";
          btn.style.background = "#1a73e8";
        }, 3000);
      }
    };

    container.appendChild(btn);
    container.appendChild(statusBox);

    // Append container ke bawah blok soal
    // Cari elemen footer soal agar tombol rapi di bawah
    const footer = block.querySelector(".DnA7s") || block;
    if (footer !== block) {
      footer.parentNode.insertBefore(container, footer.nextSibling);
    } else {
      block.appendChild(container);
    }
  });
}

// --- FUNGSI BANTUAN ---

// 1. Normalisasi Teks (Hapus spasi, titik, huruf besar, agar pencocokan akurat)
function normalizeText(str) {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, ""); // "A. Dasar Negara." -> "adasarnegara"
}

// 2. Fungsi Status Update
function updateStatus(el, html, color) {
  el.innerHTML = html;
  el.style.display = "block";
  el.style.borderLeft = `4px solid ${color}`;
}

// 3. SIMULASI KLIK MANUSIA (SANGAT PENTING UNTUK GOOGLE FORMS)
// Google Forms sering mengabaikan .click() biasa.
function simulateClick(element) {
  // Scroll ke elemen biar kelihatan (kadang required oleh browser)
  element.scrollIntoView({ behavior: "smooth", block: "center" });

  // Urutan event: MouseDown -> MouseUp -> Click
  const eventOptions = { bubbles: true, cancelable: true, view: window };
  element.dispatchEvent(new MouseEvent("mousedown", eventOptions));
  element.dispatchEvent(new MouseEvent("mouseup", eventOptions));
  element.dispatchEvent(new MouseEvent("click", eventOptions));

  // Khusus checkbox/radio, kadang perlu set checked manual sebagai fallback
  // (Hanya jika elemennya input asli, tapi di GForm jarang terjadi)
  if (element.tagName === "INPUT") {
    element.checked = true;
  }
}

// Jalankan inject
setInterval(injectAI, 1500);
