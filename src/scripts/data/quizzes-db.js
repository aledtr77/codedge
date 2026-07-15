// src/scripts/data/quizzes-db.js
// Database centrale contenente le domande dei quiz dei tutorial di Codedge.it.
// Tutte le entità HTML speciali (come < e >) sono state convertite in &lt; e &gt; 
// per evitare che il browser le interpreti come tag reali rompendo l'interfaccia.

export const quizzesData = {
  "html-fondamentali": [
    {
      q: "Qual è lo scopo primario dell'HTML Semantico?",
      options: [
        "Definire il colore, la disposizione e lo stile grafico degli elementi della pagina.",
        "Descrivere il significato ed il ruolo delle varie parti di contenuto (es. intestazioni, articoli, menu) per browser e motori di ricerca.",
        "Aggiungere effetti di movimento e interattività al click del mouse."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! L'HTML Semantico serve a chiarire il significato strutturale dei contenuti (es. un tag &lt;article&gt; indica un articolo reale), facilitando l'indicizzazione per Google ed aiutando l'accessibilità.",
        wrong: "Non proprio. Lo stile grafico appartiene ai CSS, e l'interattività ai JavaScript. L'HTML Semantico serve a descrivere il significato strutturale dei dati."
      }
    },
    {
      q: "Qual è la regola corretta quando inserisci (annidi) un tag dentro l'altro?",
      options: [
        "Si possono inserire tag di testo (come grassetti o corsivi) dentro tag di struttura (come paragrafi o contenitori).",
        "Si possono inserire tag strutturali grandi (come titoli o interi paragrafi) dentro elementi di testo piccoli in linea (come uno span).",
        "Non ci sono regole, i tag si possono incrociare liberamente senza un ordine preciso di chiusura."
      ],
      correct: 0,
      feedback: {
        correct: "Esatto! I tag di testo (come &lt;strong&gt; o &lt;em&gt;) vanno sempre inseriti dentro i contenitori strutturali (come &lt;p&gt; o &lt;div&gt;) e mai il contrario. Inoltre, i tag aperti per ultimi vanno sempre chiusi per primi.",
        wrong: "Sbagliato. Non puoi inserire elementi grandi (come titoli o blocchi div) dentro piccoli tag di testo. Inoltre, i tag non si possono mai incrociare: l'ultimo tag aperto deve essere il primo a essere chiuso."
      }
    },
    {
      q: "Cosa succede se si carica un'immagine nel codice tralasciando l'attributo alt?",
      options: [
        "Il browser si rifiuterà di caricare l'immagine mostrando una schermata nera d'errore.",
        "Vite bloccherà la compilazione del sito segnalando un errore di sintassi insuperabile.",
        "Il sito diventa inaccessibile per chi usa screen reader (utenti ipovedenti) e si viene penalizzati sui motori di ricerca (SEO)."
      ],
      correct: 2,
      feedback: {
        correct: "Esatto! L'assenza o la cattiva compilazione dell'attributo 'alt' impedisce agli screen reader di descrivere l'immagine a chi non può vederla, e limita notevolmente l'indicizzazione su Google.",
        wrong: "Non esattamente. Il browser caricherà comunque l'immagine, e Vite compilerà senza errori, ma arrecherai un grave danno all'accessibilità del sito e alla SEO."
      }
    },
    {
      q: "Qual è l'uso corretto del tag di interruzione di riga &lt;br&gt;?",
      options: [
        "Distanziare due paragrafi o creare spazi verticali vuoti nel layout per ragioni estetiche.",
        "Andare a capo forzatamente all'interno dello stesso blocco di testo (es. per indirizzi o poesie).",
        "Creare una riga orizzontale decorativa per separare due capitoli."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Il tag &lt;br&gt; serve unicamente per andare a capo nel testo. Per distanziare gli elementi grafici si usano i margini ed il padding nei CSS.",
        wrong: "No. Usare &lt;br&gt; per distanziare gli elementi è un errore comune; la spaziatura estetica deve essere gestita esclusivamente con i margini CSS."
      }
    },
    {
      q: "In HTML, come deve essere gestita la gerarchia dei titoli (da &lt;h1&gt; a &lt;h6&gt;)?",
      options: [
        "In base alla dimensione visiva del testo che si desidera ottenere sullo schermo.",
        "In ordine numerico logico (es. h1 -> h2 -> h3), partendo da un solo &lt;h1&gt; principale per pagina.",
        "Utilizzando solo intestazioni &lt;h1&gt; per massimizzare la rilevanza su Google."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! I titoli servono ad strutturare logicamente la pagina (come l'indice di un libro). La dimensione del font va impostata con il CSS.",
        wrong: "Sbagliato. Scegliere i tag dei titoli in base alla grandezza visiva distrugge l'accessibilità del sito. La gerarchia deve seguire un ordine logico (h1 -> h2 -> h3)."
      }
    },
    {
      q: "Qual è la differenza principale tra la sezione &lt;head&gt; e il &lt;body&gt;?",
      options: [
        "La sezione &lt;head&gt; contiene le informazioni invisibili e i metadati; il &lt;body&gt; racchiude tutto il contenuto visibile a schermo.",
        "L'head serve per caricare il foglio di stile CSS, mentre il body serve solo per il codice JavaScript.",
        "L'head viene scaricato dopo il body per ottimizzare la velocità di caricamento."
      ],
      correct: 0,
      feedback: {
        correct: "Esatto! L'head racchiude metadati, fogli di stile, font e configurazioni usati dai browser e dai motori di ricerca. Il body contiene ciò che l'utente vede e con cui interagisce.",
        wrong: "Non è corretto. L'head contiene informazioni strutturali invisibili all'utente e viene caricato prima del body per definire le regole base."
      }
    },
    {
      q: "Quale dei seguenti link rappresenta l'utilizzo corretto di un link relativo?",
      options: [
        "&lt;a href='https://google.com'&gt;Google&lt;/a&gt;",
        "&lt;a href='/tutorial/css-fondamentali/'&gt;CSS Fondamentali&lt;/a&gt;",
        "&lt;a href='mailto:info@codedge.it'&gt;Scrivici&lt;/a&gt;"
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Un link relativo punta a una risorsa interna allo stesso dominio senza ripetere il nome del sito web (es. '/chi-sono/').",
        wrong: "No. Un URL che inizia con 'https://' è un link assoluto (punta all'esterno), e un 'mailto:' è un collegamento e-mail."
      }
    },
    {
      q: "A cosa servono i tag generici &lt;div&gt; (blocco) e &lt;span&gt; (in linea)?",
      options: [
        "A definire sezioni semantiche importanti del testo come articoli o biografie.",
        "Ad agire come scatole e contenitori neutri per applicare stili CSS o logiche JavaScript.",
        "A incorporare immagini, video e file multimediali nella pagina."
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
        "&lt;p&gt; (Paragrafo)",
        "&lt;img&gt; (Immagine)",
        "&lt;ul&gt; (Lista)"
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Il tag &lt;img&gt; non racchiude testo ed è auto-chiudente, definendo la sorgente tramite l'attributo 'src'.",
        wrong: "Errato. I tag &lt;p&gt; e &lt;ul&gt; richiedono sempre il rispettivo tag di chiusura (&lt;/p&gt; e &lt;/ul&gt;)."
      }
    },
    {
      q: "Qual è il modo corretto di collegare una &lt;label&gt; a un campo &lt;input&gt; in un modulo (form)?",
      options: [
        "Assegnare lo stesso valore all'attributo 'name' su entrambi gli elementi.",
        "Utilizzare l'attributo 'for' sulla label con lo stesso valore dell' 'id' presente nell'input.",
        "Posizionare la label subito dopo l'input senza aggiungere alcun collegamento di codice."
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
