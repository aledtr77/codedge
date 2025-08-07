document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("search");
  const clickableItems = document.querySelectorAll(".clickable-item");
  const details = document.getElementsByTagName("details");
  const header = document.querySelector("header");
  const menuIcon = document.querySelector(".menu-icon");
  const navMenu = document.querySelector(".nav-menu");
  const sidebarToggle = document.querySelector(".sidebar-toggle");
  const sidebar = document.querySelector("aside");
  const mainContent = document.querySelector(".main-content");

  let headerHeight = header ? header.offsetHeight : 0;

  // Funzione per calcolare l'altezza dell'header
  function updateHeaderHeight() {
    headerHeight = header ? header.offsetHeight : 0;
  }

  // Aggiorna l'altezza dell'header quando la finestra viene ridimensionata
  window.addEventListener("resize", updateHeaderHeight);

  // Implementazione del lazy loading
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const detail = entry.target;
          if (!detail.hasAttribute("data-loaded")) {
            // Qui puoi caricare il contenuto dinamicamente se necessario
            // Per ora, segniamo semplicemente l'elemento come caricato
            detail.setAttribute("data-loaded", "true");
            observer.unobserve(detail);
          }
        }
      });
    },
    { rootMargin: "200px" }
  );

  // Osserva tutti gli elementi <details>
  Array.from(details).forEach((detail) => observer.observe(detail));

  // Funzione per gestire la ricerca
  function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    let firstMatch = null;
    let highPriorityMatch = null;

    Array.from(details).forEach((detail) => {
      const summary = detail.querySelector("summary");
      const summaryText = summary.textContent || summary.innerText;

      if (searchTerm === "") {
        detail.open = false;
      } else if (
        detail.hasAttribute("data-priority") &&
        summaryText.toLowerCase().startsWith(searchTerm)
      ) {
        detail.open = true;
        if (!highPriorityMatch) {
          highPriorityMatch = detail;
        }
      } else if (summaryText.toLowerCase().startsWith(searchTerm)) {
        detail.open = true;
        if (!firstMatch) {
          firstMatch = detail;
        }
      } else {
        detail.open = false;
      }

      // Se l'elemento viene aperto, assicuriamoci che sia caricato
      if (detail.open && !detail.hasAttribute("data-loaded")) {
        detail.setAttribute("data-loaded", "true");
        // Qui puoi aggiungere la logica per caricare il contenuto se necessario
      }
    });

    const matchToScroll = highPriorityMatch || firstMatch;
    if (matchToScroll) {
      setTimeout(() => {
        updateHeaderHeight();
        const yOffset = -headerHeight - 0;
        const y =
          matchToScroll.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }, 100);
    }
  }

  // Gestisci l'input di ricerca
  searchInput.addEventListener("input", handleSearch);

  // Gestione degli elementi cliccabili nella sidebar
  clickableItems.forEach((item) => {
    item.addEventListener("click", function () {
      const itemText = this.textContent.trim();
      searchInput.value = itemText;

      setTimeout(() => {
        handleSearch();

        const inputEvent = new Event("input", {
          bubbles: true,
          cancelable: true,
        });
        searchInput.dispatchEvent(inputEvent);
      }, 0);

      if (window.innerWidth <= 768) {
        sidebar.classList.remove("active");
        sidebarToggle.classList.remove("active");
      }
    });
  });

  // Funzione per copiare il codice
  window.copyCode = function (button) {
    const codeContainer = button.closest(".code-container");
    const codeElement = codeContainer.querySelector("code");
    const textArea = document.createElement("textarea");
    textArea.value = codeElement.innerText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);

    const originalHtml = button.innerHTML;
    const icon = button.querySelector("i").outerHTML;
    button.innerHTML = icon + " Copiato!";
    setTimeout(() => {
      button.innerHTML = originalHtml;
    }, 2000);
  };

  // Gestione del menu hamburger
  if (menuIcon && navMenu) {
    menuIcon.addEventListener("click", function () {
      this.classList.toggle("active");
      navMenu.classList.toggle("active");
      document.body.classList.toggle("menu-open");
    });

    document.querySelectorAll(".nav-link").forEach((el) => {
      el.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", function (event) {
      const isClickInside =
        navMenu.contains(event.target) || menuIcon.contains(event.target);
      if (!isClickInside && navMenu.classList.contains("active")) {
        closeMenu();
      }
    });
  }

  // Gestione del toggle della sidebar
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", function () {
      this.classList.toggle("active");
      sidebar.classList.toggle("active");
      mainContent.classList.toggle("aside-open");
    });

    document.addEventListener("click", function (event) {
      const isClickInside =
        sidebar.contains(event.target) || sidebarToggle.contains(event.target);
      if (
        !isClickInside &&
        sidebar.classList.contains("active") &&
        window.innerWidth <= 768
      ) {
        sidebarToggle.classList.remove("active");
        sidebar.classList.remove("active");
        mainContent.classList.remove("aside-open");
      }
    });
  }

  function closeMenu() {
    menuIcon.classList.remove("active");
    navMenu.classList.remove("active");
    document.body.classList.remove("menu-open");
  }

  // Salva lo stato delle card aperte quando la pagina perde il focus
  let openCardState = [];
  window.addEventListener("blur", function () {
    openCardState = Array.from(details).map((detail) => detail.open);
  });

  // Ripristina lo stato delle card quando la pagina riacquista il focus
  window.addEventListener("focus", function () {
    updateHeaderHeight();
    Array.from(details).forEach((detail, index) => {
      detail.open = openCardState[index] || false;
    });
  });

  // Pulisci l'input quando l'utente naviga via dalla pagina
  window.addEventListener("beforeunload", function () {
    searchInput.value = "";
  });

  // Esegui la ricerca iniziale dopo un breve ritardo
  setTimeout(handleSearch, 300);
});

/* --- LOGO + H1 PER QUALSIASI NAVBAR --- */
const logos = document.querySelectorAll(".logo"); // può esserci più di un logo
const headings = document.querySelectorAll(".invisible-text, .resize-text"); // prende entrambe le classi

function handleResize() {
  if (window.innerWidth < 1200) {
    logos.forEach((logo) => (logo.style.display = "none"));
    headings.forEach((h1) => (h1.style.display = "none"));
  } else {
    logos.forEach((logo) => (logo.style.display = ""));
    headings.forEach((h1) => (h1.style.display = ""));
  }
}

window.addEventListener("resize", handleResize);
handleResize();
