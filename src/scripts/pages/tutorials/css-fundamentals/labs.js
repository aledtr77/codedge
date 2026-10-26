import { cssExperiments } from "./experiments.js";

const words = {
  it: { reset: "Ripristina", css: "CSS", html: "HTML dell’esempio", base: "Stili di base dell’anteprima", scaled: "Anteprima ridotta per entrare nello spazio disponibile. Le misure indicate sono in pixel CSS della finestra dell’esempio.", result: "Risultato spiegato", before: "Valore iniziale", changed: "Valore modificato", lines: "CSS dell’esempio" },
  en: { reset: "Reset", css: "CSS", html: "Example HTML", base: "Preview base styles", scaled: "Preview scaled down to fit the available space. Measurements are CSS pixels in the example viewport.", result: "Result explained", before: "Initial value", changed: "Changed value", lines: "Example CSS" },
};

// Fixed examples only; no scripts run inside the previews. Each document has
// an independent viewport, so media queries and relative units are real CSS.
const baseCSS = `
  html { color-scheme: dark; background: #0c111b; }
  body { margin: 0; padding: 12px; color: #e4eaf2; font: 16px/1.5 system-ui, sans-serif; }
  p { margin: 0; }
  input { box-sizing: border-box; font: inherit; color: inherit; background: #182538; }
`;

function showCode(code, source, result) {
  code.replaceChildren();
  const lines = source.split("\n");
  lines.forEach((text, index) => {
    const line = document.createElement("span");
    line.className = "css-lab__line";
    if (result.dimLines?.includes(index)) line.classList.add("css-lab__line--overridden");
    if (result.activeLines?.includes(index)) line.classList.add("css-lab__line--active");
    line.textContent = text + (index < lines.length - 1 ? "\n" : "");
    code.append(line);
  });
}

const instances = new Map();

export default function initCssLabs(savedStates = {}) {
  const lang = document.documentElement.lang === "en" ? "en" : "it";
  const w = words[lang];
  const experiments = cssExperiments(lang);
  document.querySelectorAll("[data-css-lab]").forEach((lab) => {
    if (lab.dataset.ready) return;
    const key = lab.dataset.cssLab;
    const experiment = experiments[key];
    if (!experiment) return;
    const initialState = { ...experiment.initial, ...Object.fromEntries(experiment.controls.map((c) => [c.name, String(c.value)])) };
    const state = { ...initialState, ...savedStates[key] };
    const baseline = experiment.render(initialState);
    const initial = experiment.render(state);
    const body = document.createElement("div");
    body.className = "css-lab__interactive";
    body.innerHTML = `
      <div class="css-lab__html"><strong>${w.html}</strong><pre tabindex="0" role="region" aria-label="HTML"><code></code></pre></div>
      <div class="css-lab__workspace">
        <div class="css-lab__visual">
          <div class="css-lab__window-bar"><span class="css-lab__window-dot" aria-hidden="true"></span><span class="css-lab__window-name"></span></div>
          <div class="css-lab__viewport"><iframe sandbox="allow-same-origin"></iframe></div>
          <div class="css-lab__readings" aria-live="off"></div>
        </div>
        <div class="css-lab__tools">
          <div class="css-lab__source"><div class="css-lab__source-heading"><span>${w.css}</span><span class="css-lab__state"></span></div><pre tabindex="0" role="region" aria-label="${w.lines}"><code></code></pre></div>
          <form><div class="css-lab__controls"></div><button type="reset" class="css-lab__reset">↺ ${w.reset}</button></form>
        </div>
      </div>
      <p class="css-lab__scale-note" hidden>${w.scaled}</p>
      <div class="css-lab__feedback"><strong>${w.result}</strong><p aria-live="polite" aria-atomic="true"></p></div>
      <details class="css-lab__base"><summary>${w.base}</summary><pre tabindex="0" role="region" aria-label="${w.base}"><code></code></pre></details>
    `;
    body.querySelector(".css-lab__window-name").textContent = experiment.scene;
    body.querySelector(".css-lab__base code").textContent = baseCSS.trim();
    body.querySelector("form").hidden = experiment.controls.length === 0;
    const controls = body.querySelector(".css-lab__controls");
    const syncControls = [];
    const change = (patch) => {
      Object.assign(state, patch);
      syncControls.forEach((sync) => sync());
      update();
    };
    for (const control of experiment.controls) {
      const group = document.createElement("fieldset");
      const legend = document.createElement("legend");
      legend.textContent = control.label;
      group.append(legend);
      if (control.options) {
        const choices = document.createElement("div");
        choices.className = "css-lab__choices";
        if (control.swatches) choices.classList.add("css-lab__choices--swatches");
        for (const option of control.options) {
          const button = document.createElement("button");
          button.type = "button";
          button.name = control.name;
          button.value = option.value;
          button.className = "css-lab__choice";
          if (control.swatches) {
            const dot = document.createElement("span");
            dot.className = "css-lab__swatch";
            dot.style.backgroundColor = option.value;
            dot.setAttribute("aria-hidden", "true");
            button.append(dot);
          }
          const text = document.createElement("span");
          text.textContent = option.label;
          button.append(text);
          if (option.detail) {
            const detail = document.createElement("small");
            detail.textContent = option.detail;
            button.append(detail);
          }
          syncControls.push(() => button.setAttribute("aria-pressed", String(state[control.name] === option.value)));
          button.addEventListener("click", () => change({ [control.name]: option.value }));
          choices.append(button);
        }
        group.append(choices);
      } else {
        const wrap = document.createElement("div");
        wrap.className = "css-lab__range";
        const input = document.createElement("input");
        const id = `css-${key}-${control.name}`;
        const label = document.createElement("label");
        label.htmlFor = id;
        label.className = "sr-only";
        label.textContent = control.label;
        input.id = id;
        input.name = control.name;
        input.type = "range";
        input.min = control.min;
        input.max = control.max;
        input.step = control.step || 1;
        const output = document.createElement("output");
        output.htmlFor = id;
        syncControls.push(() => {
          input.value = state[control.name];
          output.textContent = `${state[control.name]}${control.unit || ""}`;
        });
        input.addEventListener("input", () => change({ [control.name]: input.value }));
        wrap.append(label, input, output);
        group.append(wrap);
        if (control.presets) {
          const presets = document.createElement("div");
          presets.className = "css-lab__presets";
          for (const preset of control.presets) {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = preset.label;
            button.addEventListener("click", () => change({ [control.name]: String(preset.value) }));
            presets.append(button);
          }
          group.append(presets);
        }
      }
      controls.append(group);
    }
    const frame = body.querySelector("iframe");
    frame.title = experiment.scene;
    const viewport = body.querySelector(".css-lab__viewport");
    const cssCode = body.querySelector(".css-lab__source code");
    const htmlCode = body.querySelector(".css-lab__html code");
    const note = body.querySelector(".css-lab__feedback p");
    const readings = body.querySelector(".css-lab__readings");
    const fit = () => {
      const available = viewport.clientWidth;
      if (!available) return;
      const width = key === "responsive" ? Number(state.width) : Math.max(experiment.minWidth || 0, available);
      const scale = Math.min(1, available / width);
      body.querySelector(".css-lab__scale-note").hidden = scale === 1;
      frame.style.width = `${width}px`;
      frame.style.height = `${experiment.height}px`;
      const height = Math.max(experiment.height, Math.ceil(frame.contentDocument?.body?.getBoundingClientRect().height || 0));
      frame.style.height = `${height}px`;
      frame.style.transform = `scale(${scale})`;
      frame.style.marginLeft = `${Math.max(0, (available - width * scale) / 2)}px`;
      viewport.style.height = `${Math.ceil(height * scale)}px`;
    };
    const inspect = () => {
      if (!frame.contentDocument?.getElementById("experiment")) return;
      readings.replaceChildren();
      for (const reading of experiment.inspect?.(frame.contentDocument, state) || []) {
        const item = document.createElement("div");
        const label = document.createElement("span");
        const value = document.createElement("strong");
        label.textContent = reading.label;
        value.textContent = reading.value;
        item.append(label, value);
        readings.append(item);
      }
    };
    const update = () => {
      const result = experiment.render(state);
      showCode(cssCode, result.css, result);
      htmlCode.textContent = result.html;
      note.textContent = result.note;
      body.querySelector(".css-lab__state").textContent = result.css === baseline.css ? w.before : w.changed;
      const doc = frame.contentDocument;
      const style = doc?.getElementById("experiment");
      if (style) {
        style.textContent = result.css;
        experiment.sync?.(doc, state);
      }
      fit();
      inspect();
    };
    frame.addEventListener("load", () => {
      experiment.bind?.(frame.contentDocument, change, state);
      update();
    });
    frame.srcdoc = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>${baseCSS}${experiment.base || ""}</style><style id="experiment">${initial.css}</style></head><body>${initial.html}</body></html>`;
    body.querySelector("form").addEventListener("submit", (event) => event.preventDefault());
    body.querySelector("form").addEventListener("reset", (event) => {
      event.preventDefault();
      change(initialState);
    });
    lab.append(body);
    syncControls.forEach((sync) => sync());
    const observer = new ResizeObserver(() => { fit(); inspect(); });
    observer.observe(viewport);
    instances.set(key, { lab, body, observer, state });
    lab.dataset.ready = "true";
    update();
  });
}

// The site's language switch keeps the DOM alive. Rebuild generated labels
// and frame content in the new language while retaining each reader choice.
window.addEventListener("codedge:lang-changed", () => {
  const states = {};
  for (const [key, instance] of instances) {
    states[key] = { ...instance.state };
    instance.observer.disconnect();
    instance.body.remove();
    delete instance.lab.dataset.ready;
  }
  instances.clear();
  initCssLabs(states);
});
