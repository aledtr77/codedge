import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import "@/styles/pages/tutorials/git-without-panic/index.css";
import "@/styles/components/playground.css";
import "@/styles/pages/tutorials/html-fundamentals/relative-paths.css";
import "@/styles/pages/tutorials/html-fundamentals/lists-intro.css";
import "@/styles/pages/tutorials/html-fundamentals/alt-comparator.css";
import "@/styles/pages/tutorials/html-fundamentals/boilerplate-explorer.css";
import "@/styles/pages/tutorials/html-fundamentals/text-structure.css";
import "@/styles/pages/tutorials/html-fundamentals/flow-explorer.css";
import "@/styles/pages/tutorials/html-fundamentals/label-explorer.css";
import "@/styles/pages/tutorials/html-fundamentals/table-explorer.css";
import "@/styles/pages/tutorials/html-fundamentals/neutral-explorer.css";
import "@/styles/pages/tutorials/html-fundamentals/page-map.css";
import "@/styles/pages/tutorials/html-fundamentals/form-lab.css";

import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

import initGuideToc from "@/scripts/components/guide-toc.js";
import initGuideQuiz from "@/scripts/components/guide-quiz.js";
import initGuidePlayground from "@/scripts/components/guide-playground.js";
import initRelativePathsExplorer from "./relative-paths.js";
import initListsIntro from "./lists-intro.js";
import initAltComparator from "./alt-comparator.js";
import initBoilerplateExplorer from "./boilerplate-explorer.js";
import initTextStructureExplorer from "./text-structure.js";
import initFlowExplorer from "./flow-explorer.js";
import initLabelExplorer from "./label-explorer.js";
import initTableExplorer from "./table-explorer.js";
import initNeutralExplorer from "./neutral-explorer.js";
import initPageMap from "./page-map.js";
import initFormLab from "./form-lab.js";

document.addEventListener("DOMContentLoaded", () => {
  initGuideToc();
  initGuideQuiz();
  initGuidePlayground();
  initRelativePathsExplorer();
  initListsIntro();
  initAltComparator();
  initBoilerplateExplorer();
  initTextStructureExplorer();
  initFlowExplorer();
  initLabelExplorer();
  initTableExplorer();
  initNeutralExplorer();
  initPageMap();
  initFormLab();
});
