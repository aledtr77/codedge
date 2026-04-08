// src/scripts/pages/footer/contatti/contatti.js
// Modulo per il form contatti. Esporta initContactForm().
// Supporta sia l'uso via CDN (window.emailjs) che via pacchetto npm (@emailjs/browser).

let _initialized = false;
let _bound = false;
let _submitHandler = null;
let _emailjs = null;
let _feedbackTimer = null;

async function ensureEmailjs() {
  if (_emailjs) return _emailjs;

  // Prima prova il CDN (window.emailjs)
  if (typeof window !== "undefined" && window.emailjs) {
    _emailjs = window.emailjs;
    return _emailjs;
  }

  // Altrimenti prova a importare dinamicamente il pacchetto (richiede npm install @emailjs/browser)
  try {
    const mod = await import("@emailjs/browser");
    _emailjs = mod.default || mod;
    return _emailjs;
  } catch (err) {
    console.warn(
      "[contatti] emailjs non disponibile (CDN mancante e @emailjs/browser non installato).",
      err
    );
    _emailjs = null;
    return null;
  }
}

export async function initContactForm({
  userId,
  serviceId = "service_7629q4n",
  templateId = "template_6gwohrk",
  formSelector = "#contact-form",
  feedbackSelector = "#feedback",
  submitBtnSelector = "button[type='submit']",
  honeypotFieldName = "website",
  minimumFillMs = 3000,
  cooldownMs = 60000,
  cooldownStorageKey = "codedge:contact-form:last-send",
  loadingMessage = "Invio in corso...",
  feedbackDuration = 4000,
} = {}) {
  if (_initialized) return;
  _initialized = true;

  if (!userId) {
    console.warn("[contatti] userId mancante: passa userId a initContactForm()");
    return;
  }

  const emailjs = await ensureEmailjs();
  if (!emailjs) {
    console.error(
      "[contatti] emailjs non disponibile. Aggiungi il CDN o installa @emailjs/browser."
    );
    return;
  }

  // inizializza (emailjs.init è idempotente)
  try {
    if (typeof emailjs.init === "function") {
      emailjs.init(userId);
    }
  } catch (err) {
    console.warn("[contatti] impossibile inizializzare emailjs:", err);
  }

  const form = document.querySelector(formSelector);
  const feedback = document.querySelector(feedbackSelector);
  const initTime = typeof performance !== "undefined" ? performance.now() : Date.now();

  if (!form) {
    console.warn("[contatti] Form non trovato, skip init.");
    return;
  }

  const button = form.querySelector(submitBtnSelector) || form.querySelector("button");

  function hideFeedback() {
    if (!feedback) return;
    feedback.classList.remove("show", "is-loading");
    feedback.textContent = "";
  }

  function showFeedback(message, { isLoading = false } = {}) {
    if (!feedback) return;
    if (_feedbackTimer) {
      clearTimeout(_feedbackTimer);
      _feedbackTimer = null;
    }

    feedback.textContent = message;
    feedback.classList.add("show");
    feedback.classList.toggle("is-loading", isLoading);

    if (isLoading) return;

    _feedbackTimer = window.setTimeout(() => {
      hideFeedback();
    }, feedbackDuration);
  }

  function resetForm() {
    try {
      form.reset();
    } catch (e) {
      /* ignore */
    }
  }

  function getCooldownRemaining() {
    try {
      const lastSentAt = Number(localStorage.getItem(cooldownStorageKey) || 0);
      if (!lastSentAt) return 0;
      return Math.max(0, lastSentAt + cooldownMs - Date.now());
    } catch {
      return 0;
    }
  }

  function setCooldown() {
    try {
      localStorage.setItem(cooldownStorageKey, String(Date.now()));
    } catch {
      // ignore localStorage failures
    }
  }

  function validateForm() {
    const required = Array.from(form.querySelectorAll("[required]"));
    for (const el of required) {
      if (!el.value || !String(el.value).trim()) {
        el.focus();
        return false;
      }

      if (typeof el.checkValidity === "function" && !el.checkValidity()) {
        el.focus();
        return false;
      }
    }
    return true;
  }

  function getSubmissionGuardMessage(formData) {
    const honeypotValue = String(formData.get(honeypotFieldName) || "").trim();
    if (honeypotValue) {
      console.warn("[contatti] submit bloccato dal campo honeypot.");
      return "Invio non consentito.";
    }

    const elapsedMs =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - initTime;

    if (elapsedMs < minimumFillMs) {
      return "Attendi qualche secondo prima di inviare il messaggio.";
    }

    const cooldownRemaining = getCooldownRemaining();
    if (cooldownRemaining > 0) {
      return `Attendi ${Math.ceil(cooldownRemaining / 1000)} secondi prima di inviare un altro messaggio.`;
    }

    return "";
  }

  _submitHandler = async function (ev) {
    ev.preventDefault();

    if (!validateForm()) {
      showFeedback("Compila i campi obbligatori.");
      return;
    }

    const data = new FormData(form);
    const guardMessage = getSubmissionGuardMessage(data);
    if (guardMessage) {
      showFeedback(guardMessage);
      return;
    }

    if (button) button.disabled = true;
    if (button) button.setAttribute("aria-busy", "true");
    showFeedback(loadingMessage, { isLoading: true });

    const formEntries = Object.fromEntries(
      Array.from(data.entries()).filter(([key]) => key !== honeypotFieldName)
    );
    const templateParams = {
      contatto: data.get("nome") || data.get("name") || "",
      name: data.get("nome") || data.get("name") || "",
      email: data.get("email") || "",
      oggetto: data.get("oggetto") || data.get("subject") || "",
      subject: data.get("oggetto") || data.get("subject") || "",
      message: data.get("messaggio") || data.get("message") || "",
      form: formEntries,
    };

    try {
      await emailjs.send(serviceId, templateId, templateParams);
      setCooldown();
      showFeedback("Messaggio inviato con successo!");
      resetForm();
    } catch (err) {
      console.error("[contatti] send error:", err);
      showFeedback("Errore durante l'invio. Riprova.");
    } finally {
      if (button) button.disabled = false;
      if (button) button.removeAttribute("aria-busy");
    }
  };

  if (!_bound) {
    form.addEventListener("submit", _submitHandler);
    _bound = true;
  }

  // Ritorniamo un oggetto per poter distruggere il binding se necessario (utile per HMR)
  return {
    destroy() {
      if (_bound && _submitHandler) {
        form.removeEventListener("submit", _submitHandler);
        _bound = false;
        _submitHandler = null;
      }
      hideFeedback();
      _initialized = false;
    },
  };
}
