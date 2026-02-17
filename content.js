const API_URL = "http://localhost:3000/api/solve";

function injectAI() {
  // Select all question containers in Google Forms
  const blocks = document.querySelectorAll('.geS5n, div[role="listitem"]');

  blocks.forEach((block) => {
    if (block.querySelector(".gemini-btn")) return;

    const btn = document.createElement("button");
    btn.innerText = "Solve with AI ✨";
    btn.className = "gemini-btn";
    btn.style =
      "margin: 10px; padding: 10px; background: #1a73e8; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-family: 'Google Sans',Roboto,Arial,sans-serif;";

    btn.onclick = async (e) => {
      e.preventDefault();

      // Scrape question and options
      const qEl =
        block.querySelector('[role="heading"]') ||
        block.querySelector('div[dir="auto"]');
      const optionElements = Array.from(
        block.querySelectorAll(
          '.aDTYp, .docssharedWizToggleLabeledLabelText, [role="radio"], [role="checkbox"]',
        ),
      );
      const options = optionElements
        .map((el) => el.innerText.trim())
        .filter((t) => t.length > 0);

      // Detect input field for essay questions
      const textInput = block.querySelector('input[type="text"], textarea');

      if (!qEl) return;

      btn.innerText = "Processing... ⚡";
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: qEl.innerText.trim(), options }),
        });

        const data = await res.json();

        if (data.type === "multiple") {
          // Automatically click the correct option
          let clicked = false;
          optionElements.forEach((el) => {
            if (el.innerText.trim() === data.answer) {
              el.click();
              clicked = true;
            }
          });
          if (!clicked)
            console.log("AI suggested an option not found on screen.");
        } else if (textInput) {
          // Automatically type the essay answer
          textInput.value = data.answer;
          // Trigger input event so Google Forms recognizes the change
          textInput.dispatchEvent(new Event("input", { bubbles: true }));
        }

        btn.innerText = "Solved! ✅";
        btn.style.background = "#0f9d58";
      } catch (err) {
        btn.innerText = "Error ❌";
        console.error("Connection failed to local server.");
      } finally {
        setTimeout(() => {
          btn.innerText = "Solve with AI ✨";
          btn.style.background = "#1a73e8";
        }, 3000);
      }
    };

    block.appendChild(btn);
  });
}

// Re-run injection every 2 seconds to handle dynamic loading
setInterval(injectAI, 2000);
