// src/scripts/components/guide-quiz.js
// Motore dinamico per i quiz interattivi guidati da dati (quizzes-db.js).
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
      .map((item) => {
        return `<button type="button" class="quiz-option-btn" data-correct="${item.isCorrect}">${item.opt}</button>`;
      })
      .join("\n");

    wrapper.innerHTML = `
      <div class="quiz-question-card" data-question="${index + 1}">
        <p class="quiz-question-text"><strong>${index + 1}. ${qData.q}</strong></p>
        <div class="quiz-options">
          ${optionsHtml}
        </div>
        <div class="quiz-feedback is-hidden"></div>
        <button type="button" class="quiz-next-btn button-simple is-hidden">
          ${index === questions.length - 1 ? 'Vedi Risultati' : 'Prossima domanda'} <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;

    const card = wrapper.querySelector(".quiz-question-card");
    const buttons = card.querySelectorAll(".quiz-option-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => handleOptionClick(card, btn, index));
    });

    const nextBtn = card.querySelector(".quiz-next-btn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
          renderQuestion(currentQuestionIndex);
        } else {
          showResults();
        }
      });
    }
  };

  const handleOptionClick = (card, button, qIdx) => {
    const qData = questions[qIdx];
    const isCorrect = button.dataset.correct === "true";
    const buttons = card.querySelectorAll(".quiz-option-btn");
    const feedback = card.querySelector(".quiz-feedback");
    const nextBtn = card.querySelector(".quiz-next-btn");

    buttons.forEach((btn) => {
      btn.disabled = true;
      if (btn.dataset.correct === "true") {
        btn.classList.add("is-correct");
      }
    });

    if (isCorrect) {
      button.classList.add("is-correct");
      score++;
      if (feedback) {
        feedback.textContent = qData.feedback.correct;
        feedback.className = "quiz-feedback is-correct";
      }
    } else {
      button.classList.add("is-wrong");
      if (feedback) {
        feedback.textContent = qData.feedback.wrong;
        feedback.className = "quiz-feedback is-wrong";
      }
    }

    if (nextBtn) nextBtn.classList.remove("is-hidden");
  };

  const showResults = () => {
    let msg = "";
    let confettiHtml = "";
    if (score === 10) {
      msg = "Perfetto! Hai risposto correttamente a tutte le 10 domande. Sei ufficialmente un esperto di questo capitolo!";
      
      // Generazione dinamica di 30 particelle di coriandoli
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
