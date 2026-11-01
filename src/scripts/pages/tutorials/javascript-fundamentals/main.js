import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import "@/styles/pages/tutorials/git-without-panic/index.css";
import "@/styles/pages/tutorials/javascript-fundamentals/index.css";
import "@/styles/components/playground.css";

import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

import initGuideToc from "@/scripts/components/guide-toc.js";
import initGuideQuiz from "@/scripts/components/guide-quiz.js";
import initGuidePlayground from "@/scripts/components/guide-playground.js";

document.addEventListener("DOMContentLoaded", () => {
  initGuideToc();
  initGuideQuiz();
  initGuidePlayground();

  const firstDemo = document.querySelector("[data-js-first-demo]");
  const demoButton = firstDemo?.querySelector("[data-js-demo-button]");
  const demoOutput = firstDemo?.querySelector("[data-js-demo-output]");
  const demoState = firstDemo?.querySelector("[data-js-demo-state]");
  if (demoButton && demoOutput) {
    demoButton.addEventListener("click", () => {
      const isItalian = document.documentElement.lang === "it";
      demoOutput.textContent = isItalian ? "Hai premuto il pulsante!" : "You pressed the button!";
      if (demoState) demoState.textContent = isItalian ? "Clic ricevuto" : "Click received";
    });
    demoButton.disabled = false;
  }
});
