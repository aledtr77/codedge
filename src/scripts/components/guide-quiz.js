// Data-driven quiz engine (questions come from quizzes-db.js).
import { quizzesData } from "@/scripts/data/quizzes-db.js";

export default function initGuideQuiz() {
  const container = document.getElementById("chapter-quiz");
  if (!container) return;

  const quizId = container.dataset.quizId;
  if (!quizId || !quizzesData[quizId]) {
    console.warn(`[guide-quiz] Nessun quiz trovato per ID: ${quizId}`);
    container.classList.add("is-hidden");
    return;
  }

  const wrapper = container.querySelector("#quiz-wrapper");
  if (!wrapper) {
    console.warn("[guide-quiz] Elemento #quiz-wrapper non trovato.");
    return;
  }

  const questions = quizzesData[quizId];
  let currentQuestionIndex = 0;
  let score = 0;

  const renderQuestion = (index) => {
    const qData = questions[index];
    const mappedOptions = qData.options.map((opt, optIdx) => ({
      opt,
      isCorrect: optIdx === qData.correct
    }));

    // Randomize option positions
    for (let i = mappedOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mappedOptions[i], mappedOptions[j]] = [mappedOptions[j], mappedOptions[i]];
    }

    const optionsHtml = mappedOptions
      .map((item, idx) => {
        const letter = String.fromCharCode(65 + idx); // A, B, C, D
        return `
          <label class="quiz-option-row" data-correct="${item.isCorrect}">
            <input type="radio" name="quiz-option-${index}" class="quiz-option-input" value="${item.isCorrect}">
            <span class="quiz-radio-circle"></span>
            <span class="quiz-option-text"><strong>${letter}.</strong> ${item.opt}</span>
          </label>
        `;
      })
      .join("\n");

    const progressPercent = ((index + 1) / questions.length) * 100;

    wrapper.innerHTML = `
      <div class="quiz-card" data-question="${index + 1}">
        <div class="quiz-header">
          <div class="quiz-meta">
            <span class="quiz-step-label">Domanda ${index + 1} di ${questions.length}</span>
            <span class="quiz-score-live">Punti: ${score}</span>
          </div>
          <div class="quiz-progress-container">
            <div class="quiz-progress-bar" style="width: ${progressPercent}%;"></div>
          </div>
        </div>
        
        <h4 class="quiz-question-title">${qData.q}</h4>
        
        <div class="quiz-options-list">
          ${optionsHtml}
        </div>
        
        <div class="quiz-feedback-box is-hidden"></div>
        
        <div class="quiz-actions">
          <button type="button" class="quiz-submit-btn button-simple" disabled>
            Verifica risposta
          </button>
          <button type="button" class="quiz-next-btn button-simple is-hidden">
            ${index === questions.length - 1 ? 'Vedi Risultati' : 'Prossima domanda'} <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    `;

    const card = wrapper.querySelector(".quiz-card");
    const inputs = card.querySelectorAll(".quiz-option-input");
    const submitBtn = card.querySelector(".quiz-submit-btn");
    const nextBtn = card.querySelector(".quiz-next-btn");
    const feedbackBox = card.querySelector(".quiz-feedback-box");

    inputs.forEach((input) => {
      input.addEventListener("change", () => {
        submitBtn.disabled = false;
      });
    });

    submitBtn.addEventListener("click", () => {
      const selectedInput = card.querySelector(".quiz-option-input:checked");
      if (!selectedInput) return;

      const isCorrect = selectedInput.value === "true";

      inputs.forEach((input) => {
        input.disabled = true;
      });

      const optionRows = card.querySelectorAll(".quiz-option-row");
      optionRows.forEach((row) => {
        const isRowCorrect = row.dataset.correct === "true";
        const isRowSelected = row.querySelector(".quiz-option-input").checked;

        row.classList.add("is-locked");
        if (isRowCorrect) {
          row.classList.add("is-correct-answer");
        } else if (isRowSelected && !isCorrect) {
          row.classList.add("is-wrong-answer");
        }
      });

      if (isCorrect) {
        score++;
        card.querySelector(".quiz-score-live").textContent = `Punti: ${score}`;
        feedbackBox.textContent = qData.feedback.correct;
        feedbackBox.className = "quiz-feedback-box is-correct";
      } else {
        feedbackBox.textContent = qData.feedback.wrong;
        feedbackBox.className = "quiz-feedback-box is-wrong";
      }

      submitBtn.classList.add("is-hidden");
      nextBtn.classList.remove("is-hidden");
    });

    nextBtn.addEventListener("click", () => {
      currentQuestionIndex++;
      if (currentQuestionIndex < questions.length) {
        renderQuestion(currentQuestionIndex);
      } else {
        showResults();
      }
    });
  };

  const showResults = () => {
    let msg = "";
    let confettiHtml = "";
    if (score === 10) {
      msg = "Perfetto! Hai risposto correttamente a tutte le 10 domande. Sei ufficialmente un esperto di questo capitolo!";
      
      confettiHtml = '<div class="quiz-confetti-container">';
      const colors = ["#7cf5c4", "#66d9ff", "#e5c158", "#ff6b6b"];
      for (let i = 0; i < 30; i++) {
        const left = Math.random() * 100;
        const delay = Math.random() * 2.5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        confettiHtml += `<div class="quiz-confetti-particle" style="left: ${left}%; animation-delay: ${delay}s; background-color: ${color};"></div>`;
      }
      confettiHtml += '</div>';
    } else if (score >= 8) {
      msg = "Ottimo lavoro! Hai risposto correttamente a " + score + " domande su 10. Hai una comprensione molto solida di questo capitolo!";
    } else if (score >= 6) {
      msg = "Sufficiente! Hai totalizzato " + score + " punti su 10. Hai superato il test, ma rileggi i concetti in cui hai sbagliato per consolidarli.";
    } else {
      msg = "Hai risposto correttamente solo a " + score + " domande su 10. Ti consigliamo di rileggere con attenzione la guida e ripetere il test.";
    }

    wrapper.innerHTML = `
      <div class="quiz-results-card">
        ${confettiHtml}
        <h3 style="position: relative; z-index: 1;">Test completato!</h3>
        <p class="quiz-results-score" style="position: relative; z-index: 1;">Punteggio: <span id="quiz-final-score">${score}</span> / 10</p>
        <p id="quiz-results-message" style="position: relative; z-index: 1;">${msg}</p>
        <button type="button" id="btn-restart-quiz" class="button-simple" style="position: relative; z-index: 1;">Ricomincia il test</button>
      </div>
    `;

    try {
      localStorage.setItem(`quiz-completed-${quizId}`, "true");
      localStorage.setItem(`quiz-score-${quizId}`, score);
    } catch (e) {
      console.warn("Impossibile salvare i risultati del quiz nel localStorage:", e);
    }

    const btnRestart = document.getElementById("btn-restart-quiz");
    if (btnRestart) {
      btnRestart.addEventListener("click", () => {
        currentQuestionIndex = 0;
        score = 0;
        renderQuestion(0);
      });
    }
  };

  renderQuestion(0);
}
