// src/pages/footer/contatti/contatti.js
// Modulo per il form contatti. Esporta initContactForm().
// Supporta sia l'uso via CDN (window.emailjs) che via pacchetto npm (@emailjs/browser).

let _initialized = false;
let _bound = false;
let _submitHandler = null;
let _emailjs = null;

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

  if (!form) {
    console.warn("[contatti] Form non trovato, skip init.");
    return;
  }

  const button = form.querySelector(submitBtnSelector) || form.querySelector("button");

  function showFeedback(message) {
    if (!feedback) return;
    feedback.innerHTML = message;
    feedback.classList.add("show");
    if (message.includes(loadingMessage)) return;
    setTimeout(() => feedback.classList.remove("show"), feedbackDuration);
  }

  function resetForm() {
    try {
      form.reset();
    } catch (e) {
      /* ignore */
    }
  }

  function validateForm() {
    const required = Array.from(form.querySelectorAll("[required]"));
    for (const el of required) {
      if (!el.value || !String(el.value).trim()) {
        el.focus();
        return false;
      }
    }
    return true;
  }

  _submitHandler = async function (ev) {
    ev.preventDefault();

    if (!validateForm()) {
      showFeedback("Compila i campi obbligatori.");
      return;
    }

    if (button) button.disabled = true;
    showFeedback(`${loadingMessage} <span class="spinner"></span>`);

    const data = new FormData(form);
    const templateParams = {
      contatto: data.get("nome") || data.get("name") || "",
      name: data.get("nome") || data.get("name") || "",
      email: data.get("email") || "",
      message: data.get("messaggio") || data.get("message") || "",
      form: Object.fromEntries(data.entries()),
    };

    try {
      await emailjs.send(serviceId, templateId, templateParams);
      showFeedback("Messaggio inviato con successo!");
      resetForm();
    } catch (err) {
      console.error("[contatti] send error:", err);
      showFeedback("Errore durante l'invio. Riprova.");
    } finally {
      if (button) button.disabled = false;
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
      _initialized = false;
    },
  };
}
