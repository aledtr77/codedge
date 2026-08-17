/* Logic for the Relative Paths Interactive Explorer widget */

const SCENARIOS = {
  A: {
    source: "index",
    target: "about",
    path: []
  },
  B: {
    source: "index",
    target: "first-post",
    path: ["blog"]
  },
  C: {
    source: "first-post",
    target: "index",
    path: ["blog", "root"]
  },
  D: {
    source: "first-post",
    target: "logo",
    path: ["blog", "root", "images"]
  },
  E: {
    source: "first-post",
    target: "blog-index",
    path: []
  }
};

export default function initRelativePathsExplorer() {
  const explorer = document.getElementById("relative-paths-explorer");
  if (!explorer) return;

  const buttons = explorer.querySelectorAll(".scenario-btn");
  const explanations = explorer.querySelectorAll(".scenario-explanation");
  const nodes = explorer.querySelectorAll(".tree-node");

  const activateScenario = (scenarioKey) => {
    const config = SCENARIOS[scenarioKey];
    if (!config) return;

    // 1. Update Scenario Buttons
    buttons.forEach((btn) => {
      if (btn.dataset.scenario === scenarioKey) {
        btn.classList.add("is-active");
      } else {
        btn.classList.remove("is-active");
      }
    });

    // 2. Update Scenario Explanation copy blocks
    explanations.forEach((exp) => {
      if (exp.dataset.scenario === scenarioKey) {
        exp.classList.add("is-active");
      } else {
        exp.classList.remove("is-active");
      }
    });

    // 3. Reset all nodes
    nodes.forEach((node) => {
      node.classList.remove("is-source", "is-target", "is-active-path");
    });

    // 4. Highlight path, source, and target nodes
    nodes.forEach((node) => {
      const nodeId = node.dataset.node;
      if (!nodeId) return;

      if (nodeId === config.source) {
        node.classList.add("is-source");
      } else if (nodeId === config.target) {
        node.classList.add("is-target");
      } else if (config.path.includes(nodeId)) {
        node.classList.add("is-active-path");
      }
    });
  };

  // Bind click handlers to scenario buttons
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const scenarioKey = btn.dataset.scenario;
      if (scenarioKey) {
        activateScenario(scenarioKey);
      }
    });
  });

  // Activate default scenario (A) on load
  activateScenario("A");
}
