// content.js
const API_URL = "http://localhost:3000/api/analyze-question";

function injectButtons() {
  // Google Forms question container
  const questions = document.querySelectorAll(".geS5n");

  questions.forEach((container) => {
    if (container.querySelector(".ai-btn")) return;

    const btn = document.createElement("button");
    btn.innerText = "Get AI Answer DAmn It ✨";
    btn.className = "ai-btn";
    btn.style =
      "margin-top: 10px; padding: 8px; cursor: pointer; background: #673ab7; color: white; border: none; border-radius: 4px;";

    const resultDiv = document.createElement("div");
    resultDiv.style =
      "display: none; margin-top: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #fafafa;";

    btn.onclick = async () => {
      // Updated Selectors: tries role="heading" first, then common classes
      const questionText =
        container.querySelector('[role="heading"]')?.innerText ||
        container.querySelector(".M7eC3")?.innerText;

      const optionTexts = Array.from(
        container.querySelectorAll(".aDTYp, .office-form-question-choice-text"),
      ).map((el) => el.innerText);

      if (!questionText) {
        alert("Could not find question text. Please check the console.");
        return;
      }

      btn.innerText = "Analyzing...";

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: questionText,
            options: optionTexts,
          }),
        });
        const data = await response.json();

        resultDiv.innerHTML = `
                    <p><strong>Answer:</strong> ${data.correct_answer}</p>
                    <button id="toggle-reason" style="font-size: 11px; cursor: pointer;">Why this answer?</button>
                    <p id="reason-text" style="display: none; margin-top: 5px; color: #555;">${data.reasoning}</p>
                `;
        resultDiv.style.display = "block";

        resultDiv.querySelector("#toggle-reason").onclick = () => {
          const rText = resultDiv.querySelector("#reason-text");
          rText.style.display =
            rText.style.display === "none" ? "block" : "none";
        };
      } catch (err) {
        console.error(err);
        alert("Connection to backend failed!");
      } finally {
        btn.innerText = "Get AI Answer ✨";
      }
    };

    container.appendChild(btn);
    container.appendChild(resultDiv);
  });
}

setInterval(injectButtons, 2000);
