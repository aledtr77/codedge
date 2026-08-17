import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import "@/styles/pages/tutorials/git-without-panic/index.css";
import "@/styles/components/playground.css";
import "@/styles/pages/tutorials/html-fundamentals/relative-paths.css";
import "@/styles/pages/tutorials/html-fundamentals/lists-intro.css";

import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

import initGuideToc from "@/scripts/components/guide-toc.js";
import initGuideQuiz from "@/scripts/components/guide-quiz.js";
import initGuidePlayground from "@/scripts/components/guide-playground.js";
import initRelativePathsExplorer from "./relative-paths.js";
import initListsIntro from "./lists-intro.js";

document.addEventListener("DOMContentLoaded", () => {
  initGuideToc();
  initGuideQuiz();
  initGuidePlayground();
  initRelativePathsExplorer();
  initListsIntro();
});
