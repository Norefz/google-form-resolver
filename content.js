const API_URL = "http://localhost:3000/api/analyze-question";

function injectAIButtons() {
  // Google Forms question container selector
  const containers = document.querySelectorAll(".geS5n");

  containers.forEach((container) => {
    if (container.querySelector(".ai-assist-container")) return;

    // Create wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "ai-assist-container";
    wrapper.style =
      "margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 10px;";

    // Create Button
    const btn = document.createElement("button");
    btn.innerText = "Get AI Answer ✨";
    btn.style =
      "background: #1a73e8; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold;";

    // Create Result Area (Hidden by default)
    const resultDiv = document.createElement("div");
    resultDiv.style =
      "display: none; margin-top: 10px; font-size: 13px; color: #333; line-height: 1.4;";

    btn.onclick = async () => {
      const questionText = container.querySelector(".M7eC3")?.innerText;
      const optionTexts = Array.from(container.querySelectorAll(".aDTYp")).map(
        (el) => el.innerText,
      );

      if (!questionText) return;

      btn.innerText = "Analyzing...";
      btn.disabled = true;

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

        // Update UI with Toggle logic
        resultDiv.innerHTML = `
          <p><strong>Answer:</strong> ${data.correct_answer}</p>
          <div style="background: #f1f3f4; padding: 10px; border-left: 4px solid #1a73e8; margin-top: 5px;">
            <strong>Reasoning:</strong><br>${data.reasoning}
          </div>
          <p style="font-size: 10px; color: gray;">Confidence: ${data.confidence}</p>
        `;
        resultDiv.style.display = "block";
      } catch (err) {
        alert("Server Error. Make sure backend is running.");
      } finally {
        btn.innerText = "Refresh AI ✨";
        btn.disabled = false;
      }
    };

    wrapper.appendChild(btn);
    wrapper.appendChild(resultDiv);
    container.appendChild(wrapper);
  });
}

// Check for new questions every 2 seconds (for long forms)
setInterval(injectAIButtons, 2000);
