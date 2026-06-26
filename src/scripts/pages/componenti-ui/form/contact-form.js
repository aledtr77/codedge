export function initValidatedContactForm(selector = "[data-contact-form]") {
  const form = document.querySelector(selector);
  if (!form) return;

  const fields = Array.from(form.querySelectorAll("[data-validate]"));
  const submitButton = form.querySelector("[data-submit-button]");
  const status = form.querySelector("[data-form-status]");

  const messages = {
    name: "Inserisci almeno 2 caratteri.",
    email: "Inserisci un indirizzo email valido.",
    topic: "Scegli un argomento.",
    message: "Scrivi un messaggio di almeno 12 caratteri.",
  };

  const setError = (field, message = "") => {
    const error = form.querySelector(`#${field.id}-error`);
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) error.textContent = message;
  };

  const getMessage = (field) => {
    const key = field.dataset.validate;
    const value = field.value.trim();
    if (field.required && !value) return messages[key] || "Campo obbligatorio.";
    if (field.type === "email" && !field.validity.valid) return messages.email;
    if (field.minLength > 0 && value.length < field.minLength) return messages[key];
    return "";
  };

  const validateField = (field) => {
    const message = getMessage(field);
    setError(field, message);
    return !message;
  };

  fields.forEach((field) => {
    field.addEventListener("input", () => validateField(field));
    field.addEventListener("blur", () => validateField(field));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const isValid = fields.map(validateField).every(Boolean);
    if (!isValid) {
      fields.find((field) => field.getAttribute("aria-invalid") === "true")?.focus();
      if (status) status.textContent = "Controlla i campi evidenziati.";
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.dataset.originalText = submitButton.textContent;
      submitButton.textContent = "Invio in corso";
    }
    if (status) status.textContent = "Messaggio pronto per l'invio.";

    window.setTimeout(() => {
      if (status) status.textContent = "Demo completata: dati validi e stato di successo mostrato.";
      form.reset();
      fields.forEach((field) => setError(field));
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = submitButton.dataset.originalText || "Invia richiesta";
      }
    }, 700);
  });
}
