// src/scripts/data/quizzes-db.js
// Database centrale contenente le domande dei quiz dei tutorial di Codedge.it.

export const quizzesData = {
  "html-fondamentali": [
    {
      q: "Qual è lo scopo primario dell'HTML Semantico?",
      options: [
        "Definire il colore e lo stile degli elementi grafici della pagina.",
        "Descrivere il significato e il ruolo del contenuto per il browser e i motori di ricerca.",
        "Rendere la pagina interattiva al click dell'utente."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! L'HTML Semantico descrive il ruolo strutturale del contenuto (es. articolo, intestazione, pulsante) fornendo informazioni preziose per motori di ricerca, browser e screen reader.",
        wrong: "Non proprio. Lo stile grafico appartiene ai CSS, e l'interattività ai JavaScript. L'HTML Semantico serve a descrivere il significato strutturale dei dati."
      }
    },
    {
      q: "Quale delle seguenti associazioni di tag è considerata corretta per il nesting?",
      options: [
        "Inserire un tag <div> o <h2> dentro un tag in linea come <span>.",
        "Inserire tag in linea come <strong> o <em> dentro elementi a blocco come <p> o <div>.",
        "Inserire il tag <body> dentro la sezione <head>."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Gli elementi in linea (come strong, em, span, a) devono essere racchiusi all'interno di elementi a blocco (come p, div, li, h2). Non è corretto il contrario.",
        wrong: "Sbagliato. Inserire elementi a blocco (come div o h2) dentro elementi in linea (come span) rompe la validità del codice HTML e può creare problemi di rendering."
      }
    },
    {
      q: "Cosa succede se si tralascia l'attributo alt su un'immagine?",
      options: [
        "L'immagine non viene caricata dal browser e si rompe il layout.",
        "Vite segnalerà un errore bloccante in fase di build.",
        "Si penalizza la SEO del sito e si rende il contenuto inaccessibile per chi usa screen reader."
      ],
      correct: 2,
      feedback: {
        correct: "Esatto! L'assenza o la cattiva compilazione del tag 'alt' impedisce agli screen reader di descrivere l'immagine a utenti ipovedenti o non vedenti, e limita l'indicizzazione del sito su Google.",
        wrong: "Non esattamente. Il browser caricherà comunque l'immagine (anche se rotta), e Vite compilerà senza errori, ma arrecherai un grave danno all'accessibilità del sito e alla SEO."
      }
    },
    {
      q: "Qual è l'uso corretto del tag <br>?",
      options: [
        "Creare margini e spaziature verticali tra i paragrafi o elementi del layout.",
        "Andare a capo all'interno di un testo continuo (es. poesie, indirizzi).",
        "Inserire una linea orizzontale divisoria nella pagina."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Il tag <br> serve unicamente per andare a capo nel testo. Per distanziare gli elementi grafici si usano i margini ed il padding nei CSS.",
        wrong: "No. Usare <br> per distanziare gli elementi è un anti-pattern; la spaziatura deve essere gestita esclusivamente con i margini CSS."
      }
    },
    {
      q: "In HTML, come deve essere gestita la gerarchia dei titoli da h1 a h6?",
      options: [
        "In base alla dimensione visiva del font che si vuole ottenere.",
        "In ordine numerico logico e strutturale, partendo da un solo h1 per pagina.",
        "Utilizzando solo h1 e h2 per evitare di appesantire il codice."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! I titoli servono ad strutturare logicamente la pagina (come l'indice di un libro). La dimensione del font va impostata con il CSS.",
        wrong: "Sbagliato. Scegliere i tag dei titoli in base alla grandezza visiva distrugge l'accessibilità del sito. La gerarchia deve seguire un ordine logico (h1 -> h2 -> h3)."
      }
    },
    {
      q: "Qual è la differenza principale tra la sezione <head> e il <body>?",
      options: [
        "L'head contiene i metadati e le configurazioni invisibili; il body contiene tutto il contenuto visibile.",
        "L'head è per i link del CSS, il body è per il codice JavaScript.",
        "L'head viene scaricato dopo il body per velocizzare il caricamento."
      ],
      correct: 0,
      feedback: {
        correct: "Esatto! L'head racchiude metadati, fogli di stile, font e configurazioni usati dai browser e dai motori di ricerca. Il body contiene ciò che l'utente vede e con cui interagisce.",
        wrong: "Non è corretto. L'head è caricato prima del body per definire le regole e le risorse base prima del rendering visivo."
      }
    },
    {
      q: "Quale tag rappresenta l'utilizzo corretto di un link relativo?",
      options: [
        "<a href='https://google.com'>Google</a>",
        "<a href='/tutorial/css-fondamentali/'>CSS Fondamentali</a>",
        "<a href='mailto:info@codedge.it'>Scrivici</a>"
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Un link relativo fa riferimento a una risorsa interna allo stesso dominio senza ripetere l'URL del sito.",
        wrong: "No. Un URL che inizia con 'https://' è un link assoluto, e un 'mailto:' è un link per client e-mail."
      }
    },
    {
      q: "A cosa servono i tag generici <div> e <span>?",
      options: [
        "A dare un significato semantico forte a blocchi e testi.",
        "Ad agire da contenitori neutri per applicare stili CSS o comportamenti JS.",
        "A caricare file multimediali come audio o video."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Div (blocco) e Span (in linea) sono tag neutri sprovvisti di significato semantico, ideali per raggruppare elementi per motivi di stile o script.",
        wrong: "No. Non hanno alcun significato semantico (a differenza di article, section o strong), e non servono a caricare media."
      }
    },
    {
      q: "Quale dei seguenti tag è definito auto-chiudente (self-closing)?",
      options: [
        "<p>",
        "<img>",
        "<ul>"
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Il tag <img> non racchiude testo ed è auto-chiudente, definendo la sorgente tramite l'attributo 'src'.",
        wrong: "Errato. I tag <p> (paragrafo) e <ul> (lista non ordinata) richiedono sempre il rispettivo tag di chiusura (</p> e </ul>)."
      }
    },
    {
      q: "Qual è il modo corretto di collegare una <label> a un campo <input> in un form?",
      options: [
        "Inserendo l'attributo name uguale su entrambi.",
        "Utilizzando l'attributo 'for' sulla label corrispondente all' 'id' dell'input.",
        "Mettendo la label dopo l'input senza alcun attributo di collegamento."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! L'attributo 'for' della label deve avere lo stesso identico valore dell'id dell'input. Questo consente ai lettori di schermo di associare il testo al rispettivo campo.",
        wrong: "No. L'attributo 'name' serve a identificare il dato inviato al server, mentre per l'accessibilità e l'interazione è obbligatorio usare for/id."
      }
    }
  ],
  "css-fondamentali": [
    {
      q: "Qual è lo scopo primario dei CSS (Cascading Style Sheets)?",
      options: [
        "Definire la struttura semantica del documento.",
        "Controllare la presentazione visiva, il layout ed i colori della pagina HTML.",
        "Rendere il sito un'applicazione PWA installabile."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! I CSS servono a descrivere come gli elementi HTML debbano essere visualizzati sullo schermo, sulla carta o su altri media.",
        wrong: "No. La struttura appartiene all'HTML, e l'installazione PWA è gestita dal manifest e dal service worker."
      }
    },
    {
      q: "Cosa si intende per 'Cascata' (Cascading) nei CSS?",
      options: [
        "La disposizione degli elementi dall'alto verso il basso.",
        "Il modo in cui le regole di stile si sovrappongono e vengono applicate in base a specificità e ordine.",
        "Il caricamento ritardato dei file CSS in background."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! La cascata stabilisce le regole di priorità nel caso in cui più stili si riferiscano allo stesso elemento, decidendo quale applicare.",
        wrong: "Errato. Non c'entra con il caricamento asincrono né con il posizionamento degli elementi nel layout."
      }
    },
    {
      q: "Quale selettore CSS ha la specificità (priorità) più alta?",
      options: [
        "Il selettore di classe (es. `.pulsante`).",
        "Il selettore di ID (es. `#sezione-principale`).",
        "Il selettore di elemento (es. `p`)."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Un selettore di ID (#id) ha una specificità nettamente superiore rispetto a classi (.classe) ed elementi (tag).",
        wrong: "No. Il selettore di elemento è il più debole, e la classe è più forte dell'elemento ma inferiore all'ID."
      }
    },
    {
      q: "Nel Box Model di CSS, da quali aree è composto un elemento (dall'interno verso l'esterno)?",
      options: [
        "Content, Margin, Border, Padding.",
        "Content, Padding, Border, Margin.",
        "Padding, Content, Margin, Border."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Partendo dal centro abbiamo il contenuto reale, poi il padding (spazio interno), il bordo dell'elemento, ed infine il margin (spazio esterno).",
        wrong: "Sbagliato. Ricorda la sequenza corretta: Contenuto -> Spazio interno (Padding) -> Bordo (Border) -> Margine esterno (Margin)."
      }
    },
    {
      q: "Qual è la differenza tra margin e padding?",
      options: [
        "Il margin è lo spazio interno all'elemento; il padding è lo spazio esterno.",
        "Il padding è lo spazio interno tra il contenuto ed il bordo; il margin è lo spazio vuoto esterno al bordo dell'elemento.",
        "Non c'è alcuna differenza, sono sinonimi intercambiabili."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Il padding distanzia il testo/contenuto dal proprio bordo interno. Il margin distanzia l'elemento intero dalle altre scatole circostanti.",
        wrong: "Errato. La differenza è fondamentale per il layout: il padding è interno al bordo e risente dello sfondo, il margin è esterno e neutro."
      }
    },
    {
      q: "A cosa serve la proprietà box-sizing: border-box?",
      options: [
        "A includere padding e border nel calcolo della larghezza e altezza totale dell'elemento.",
        "A colorare il bordo degli elementi a blocco.",
        "A nascondere i margini esterni negativi."
      ],
      correct: 0,
      feedback: {
        correct: "Esatto! Con border-box, se definisci un width di 300px, l'elemento rimarrà largo 300px anche aggiungendo padding e bordo, facilitando il calcolo del layout.",
        wrong: "No. Il box-sizing standard (content-box) somma il padding al width, allargando l'elemento. border-box risolve questo problema assorbendoli nel width impostato."
      }
    },
    {
      q: "Quale valore di display permette di allineare gli elementi su una griglia bidimensionale (righe e colonne)?",
      options: [
        "`display: flex;`",
        "`display: grid;`",
        "`display: inline-block;`"
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! CSS Grid è progettato per layout bidimensionali (griglie con righe e colonne simultanee), a differenza di Flexbox che è prevalentemente monodimensionale.",
        wrong: "No. Flexbox gestisce l'allineamento lungo una singola direzione alla volta (riga o colonna), non una griglia complessa bidimensionale."
      }
    },
    {
      q: "In Flexbox, quale proprietà si usa per allineare gli elementi lungo l'asse principale (main axis)?",
      options: [
        "`align-items`",
        "`justify-content`",
        "`flex-direction`"
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! `justify-content` allinea gli elementi lungo l'asse di scorrimento principale (di default orizzontale). `align-items` gestisce invece l'asse secondario (verticale).",
        wrong: "Errato. `align-items` agisce sull'asse secondario (cross axis) e `flex-direction` definisce la direzione dell'asse principale."
      }
    },
    {
      q: "Qual è la differenza principale tra le unità di misura rem ed em?",
      options: [
        "rem fa riferimento al font-size della root (html); em fa riferimento al font-size dell'elemento genitore.",
        "rem è un'unità fissa (pixel); em è un'unità percentuale dinamica.",
        "rem si usa solo per i margini; em si usa solo per i testi."
      ],
      correct: 0,
      feedback: {
        correct: "Esatto! Entrambe sono relative, ma rem fa riferimento alla dimensione font di base dell'HTML (rendendo il layout proporzionato), mentre em è relativo al genitore diretto, rischiando effetti a cascata complessi.",
        wrong: "Sbagliato. Entrambe sono unità relative e dinamiche (non fisse come i pixel) e possono essere utilizzate per qualsiasi proprietà (width, padding, font-size)."
      }
    },
    {
      q: "A cosa servono le Media Queries nei CSS?",
      options: [
        "A fare richieste HTTP asincrone verso un server.",
        "Ad applicare stili diversi in base alle caratteristiche del dispositivo (es. larghezza dello schermo).",
        "A riprodurre file audio e video nel browser."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Le Media Queries sono il pilastro del Responsive Web Design, permettendo di adattare l'aspetto del sito su smartphone, tablet e desktop.",
        wrong: "No. Le richieste asincrone appartengono a JavaScript (Fetch API) ed i media sono gestiti dai tag HTML5 audio/video."
      }
    }
  ]
};
