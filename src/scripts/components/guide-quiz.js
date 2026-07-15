// src/scripts/components/guide-quiz.js
// Logica riutilizzabile per i quiz interattivi a scelta multipla nei tutorial.

export default function initGuideQuiz() {
  const container = document.getElementById("guide-quiz-container");
  if (!container) return;

  const questionCards = Array.from(container.querySelectorAll(".quiz-question-card"));
  const resultsCard = container.querySelector(".quiz-results-card");
  const finalScoreSpan = document.getElementById("quiz-final-score");
  const resultsMessage = document.getElementById("quiz-results-message");
  const btnRestart = document.getElementById("btn-restart-quiz");

  let currentQuestionIndex = 0;
  let score = 0;

  const feedbacks = {
    1: {
      correct: "Esatto! L'HTML Semantico descrive il ruolo strutturale del contenuto (es. articolo, intestazione, pulsante) fornendo informazioni preziose per motori di ricerca, browser e screen reader.",
      wrong: "Non proprio. Lo stile grafico appartiene ai CSS, e l'interattività ai JavaScript. L'HTML Semantico serve a descrivere il significato strutturale dei dati."
    },
    2: {
      correct: "Esatto! Gli elementi in linea (come strong, em, span, a) devono essere racchiusi all'interno di elementi a blocco (come p, div, li, h2). Non è corretto il contrario.",
      wrong: "Sbagliato. Inserire elementi a blocco (come div o h2) dentro elementi in linea (come span) rompe la validità del codice HTML e può creare problemi di rendering."
    },
    3: {
      correct: "Esatto! L'assenza o la cattiva compilazione del tag 'alt' impedisce agli screen reader di descrivere l'immagine a utenti ipovedenti o non vedenti, e limita notevolmente l'indicizzazione delle immagini su Google.",
      wrong: "Non esattamente. Il browser caricherà comunque l'immagine (anche se rotta), e Vite compilerà senza errori, ma arrecherai un grave danno all'accessibilità del sito e alla SEO."
    }
  };

  const showQuestion = (index) => {
    questionCards.forEach((card, idx) => {
      card.classList.toggle("is-hidden", idx !== index);
    });
    if (resultsCard) resultsCard.classList.add("is-hidden");
  };

  const handleOptionClick = (card, button) => {
    const isCorrect = button.dataset.correct === "true";
    const buttons = card.querySelectorAll(".quiz-option-btn");
    const feedback = card.querySelector(".quiz-feedback");
    const nextBtn = card.querySelector(".quiz-next-btn");
    const qNum = card.dataset.question;

    // Disabilita tutte le opzioni per questa domanda
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
        feedback.textContent = feedbacks[qNum].correct;
        feedback.className = "quiz-feedback is-correct";
      }
    } else {
      button.classList.add("is-wrong");
      if (feedback) {
        feedback.textContent = feedbacks[qNum].wrong;
        feedback.className = "quiz-feedback is-wrong";
      }
    }

    if (nextBtn) nextBtn.classList.remove("is-hidden");
  };

  const showResults = () => {
    questionCards.forEach((card) => card.classList.add("is-hidden"));
    if (resultsCard) {
      resultsCard.classList.remove("is-hidden");
      if (finalScoreSpan) finalScoreSpan.textContent = score;

      let msg = "";
      if (score === 3) {
        msg = "Fantastico! Hai risposto correttamente a tutte le domande. Hai una comprensione perfetta dei fondamentali di HTML!";
      } else if (score === 2) {
        msg = "Ottimo lavoro! Hai risposto correttamente a 2 domande su 3. Rileggi i punti in cui hai sbagliato per consolidare!";
      } else {
        msg = "Puoi fare di meglio! Hai totalizzato solo 1 o 0 punti. Ti consigliamo di rileggere con attenzione la guida e riprovare.";
      }
      if (resultsMessage) resultsMessage.textContent = msg;

      // Salviamo lo stato del completamento
      try {
        localStorage.setItem(`quiz-completed-html-fondamentali`, "true");
        localStorage.setItem(`quiz-score-html-fondamentali`, score);
      } catch (e) {
        console.warn("Impossibile salvare i risultati del quiz nel localStorage:", e);
      }
    }
  };

  const resetQuiz = () => {
    currentQuestionIndex = 0;
    score = 0;
    questionCards.forEach((card) => {
      const buttons = card.querySelectorAll(".quiz-option-btn");
      const feedback = card.querySelector(".quiz-feedback");
      const nextBtn = card.querySelector(".quiz-next-btn");

      buttons.forEach((btn) => {
        btn.disabled = false;
        btn.classList.remove("is-correct", "is-wrong");
      });

      if (feedback) feedback.className = "quiz-feedback is-hidden";
      if (nextBtn) nextBtn.classList.add("is-hidden");
    });
    showQuestion(0);
  };

  // Bind dei click sulle opzioni
  questionCards.forEach((card) => {
    const buttons = card.querySelectorAll(".quiz-option-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => handleOptionClick(card, btn));
    });

    const nextBtn = card.querySelector(".quiz-next-btn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questionCards.length) {
          showQuestion(currentQuestionIndex);
        } else {
          showResults();
        }
      });
    }
  });

  if (btnRestart) {
    btnRestart.addEventListener("click", resetQuiz);
  }

  showQuestion(0);
}
