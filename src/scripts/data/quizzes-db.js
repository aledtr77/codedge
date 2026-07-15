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
        correct: "Esatto! L'assenza o la cattiva compilazione dell'attributo 'alt' impedisce agli screen reader di descrivere l'immagine a chi non può vederla, e limita l'indicizzazione del sito su Google.",
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
  ],
  "javascript-fondamentali": [
    {
      q: "Qual è lo scopo primario di JavaScript in una pagina web?",
      options: [
        "Definire lo scheletro e l'architettura semantica del testo.",
        "Applicare regole di stile grafico, allineamento spaziale e colori.",
        "Aggiungere comportamento dinamico, logica ed interattività in tempo reale."
      ],
      correct: 2,
      feedback: {
        correct: "Esatto! Se l'HTML è lo scheletro e il CSS è la vernice, JavaScript è il motore che permette di reagire al click, inviare dati in background o aggiornare parti di pagina al volo.",
        wrong: "No. La struttura è definita dall'HTML e lo stile dai CSS. JavaScript serve a rendere gli elementi intelligenti e reattivi."
      }
    },
    {
      q: "Come si dichiara una variabile in JavaScript il cui valore può essere modificato e riassegnato nel corso del programma?",
      options: [
        "Utilizzando la parola chiave 'const'.",
        "Utilizzando la parola chiave 'let'.",
        "Inserendo il valore direttamente all'interno del tag HTML &lt;var&gt;."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Le variabili create con 'let' possono essere modificate liberamente. Quelle create con 'const' sono costanti ed un tentativo di riassegnarle causerà un errore.",
        wrong: "Errato. La parola chiave 'const' serve a definire valori costanti non riassegnabili. Il tag HTML &lt;var&gt; serve solo ad indicare semanticamente una variabile matematica nel testo."
      }
    },
    {
      q: "Qual è la differenza principale tra l'operatore di uguaglianza '==' (doppio uguale) e quello di uguaglianza stretta '===' (triplo uguale)?",
      options: [
        "'==' confronta unicamente il valore (convertendo i tipi se diversi), mentre '===' confronta sia il valore che il tipo di dato (senza conversioni automatiche).",
        "'===' è un operatore obsoleto ed è stato rimosso dalle versioni moderne di JavaScript.",
        "'==' controlla solo i numeri, mentre '===' controlla solo le stringhe di testo."
      ],
      correct: 0,
      feedback: {
        correct: "Esatto! Il triplo uguale '===' (uguaglianza stretta) evita brutte sorprese perché non effettua la conversione di tipo automatica (ad esempio, per '===' il numero 5 è diverso dalla stringa '5').",
        wrong: "No. Entrambi sono operatori attivi. Il doppio uguale converte i dati prima di confrontarli, mentre il triplo uguale fa un controllo rigoroso sul tipo di dato."
      }
    },
    {
      q: "Quale delle seguenti sintassi definisce un Array (elenco ordinato) in JavaScript?",
      options: [
        "let lista = {primo: 'mela', secondo: 'banana'};",
        "let lista = ['mela', 'banana', 'arancia'];",
        "let lista = 'mela, banana, arancia';"
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Gli array si definiscono utilizzando le parentesi quadre '[ ]' e contengono un elenco ordinato di elementi separati da virgole.",
        wrong: "Errato. Le parentesi graffe '{ }' definiscono un oggetto (coppie chiave-valore), mentre l'uso delle virgolette crea una semplice stringa di testo singola."
      }
    },
    {
      q: "Cosa rappresenta una Funzione in JavaScript?",
      options: [
        "Un file CSS speciale che applica stili di colore al click del mouse.",
        "Un blocco di codice riutilizzabile progettato per eseguire una specifica operazione ogni volta che viene richiamato.",
        "Un ciclo di ripetizione che blocca l'esecuzione della pagina finché l'utente non inserisce un dato."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Le funzioni permettono di racchiudere una logica ripetitiva sotto un unico nome, rendendola invocabile ovunque ed evitando di riscrivere lo stesso codice.",
        wrong: "No. Le funzioni sono i mattoni della programmazione imperativa: svolgono compiti logici e non hanno a che fare con fogli di stile o blocchi forzati del browser."
      }
    },
    {
      q: "A cosa serve il metodo del DOM 'document.getElementById()'?",
      options: [
        "A creare da zero un nuovo elemento HTML all'interno della pagina.",
        "A selezionare un elemento HTML esistente nella pagina partendo dal valore del suo attributo 'id'.",
        "A modificare l'indirizzo IP del server ospitante."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! È uno dei metodi storici per accedere al DOM (la struttura della pagina) e manipolare un elemento specifico tramite il suo identificativo unico.",
        wrong: "Errato. Per creare elementi si usa 'document.createElement()', e JavaScript lato client nel browser non ha potere di modificare l'IP del server."
      }
    },
    {
      q: "Qual è l'effetto dell'istruzione 'console.log()'?",
      options: [
        "Mostra un messaggio nella console degli Strumenti per Sviluppatori (DevTools) del browser, utilissimo per il debug.",
        "Mostra una finestra pop-up bloccante a centro schermo per catturar l'attenzione dell'utente.",
        "Salva in modo permanente i dati all'interno del database del server."
      ],
      correct: 0,
      feedback: {
        correct: "Esatto! 'console.log()' stampa messaggi invisibili all'utente comune, ma fondamentali per lo sviluppatore per ispezionare variabili e capire se il codice scorre bene.",
        wrong: "No. Le finestre pop-up bloccanti sono generate da 'alert()', e 'console.log()' non scrive in nessun database né server."
      }
    },
    {
      q: "Qual è la differenza principale tra un Oggetto e un Array in JavaScript?",
      options: [
        "L'Array organizza i dati come una lista ordinata con indici numerici (0, 1, 2...); l'Oggetto organizza i dati tramite coppie di 'chiave: valore'.",
        "L'Array memorizza esclusivamente stringhe, mentre l'Oggetto memorizza solo numeri.",
        "Non c'è alcuna differenza, sono lo stesso tipo di dato sotto due nomi diversi."
      ],
      correct: 0,
      feedback: {
        correct: "Esatto! Si usa l'array quando l'ordine degli elementi è importante (es. una coda di messaggi). Si usa l'oggetto per descrivere un'entità con proprietà specifiche (es. utente con nome, età, e-mail).",
        wrong: "No. Entrambi possono memorizzare qualsiasi tipo di dato (numeri, stringhe, funzioni, o altri oggetti/array), ma cambia la loro struttura logica."
      }
    },
    {
      q: "Che cos'è un 'Evento' in JavaScript?",
      options: [
        "Una conferenza di programmatori per concordare lo sviluppo di nuove API.",
        "Un segnale inviato dal browser (es. click del mouse, caricamento ultimato, tasto premuto) a cui possiamo associare del codice da eseguire in risposta.",
        "Un ciclo di temporizzazione programmato che esegue un'operazione ogni ora."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Gli eventi (come 'click', 'submit', 'keydown') sono la base della programmazione asincrona nel browser, consentendo al codice di reagire alle azioni dell'utente.",
        wrong: "Errato. I cicli temporizzati si gestiscono con 'setInterval', mentre gli eventi sono legati ad accadimenti reattivi sulla pagina."
      }
    },
    {
      q: "Qual è lo scopo della parola chiave 'return' in una funzione?",
      options: [
        "Interrompere l'intero programma JavaScript e chiudere la finestra del browser dell'utente.",
        "Restituire un valore specifico all'esterno, verso il punto in cui la funzione è stata invocata.",
        "Riavviare la funzione dall'inizio creando un ciclo continuo."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! 'return' interrompe l'esecuzione della funzione ed invia il valore specificato a chi l'ha chiamata (es. una funzione di calcolo restituisce il risultato numerico).",
        wrong: "No. Non chiude il browser (per quello si usa window.close) né riavvia la funzione. Serve unicamente ad esportare l'output finale del blocco di codice."
      }
    }
  ],
  "vscode-essenziale": [
    {
      q: "Qual è lo scopo primario della Command Palette (Tavolozza dei comandi) in VS Code?",
      options: [
        "Modificare il tema grafico del sistema operativo.",
        "Accedere rapidamente a qualsiasi comando, impostazione o azione dell'editor tramite ricerca testuale.",
        "Avviare una chiamata vocale con altri sviluppatori."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! La Command Palette raccoglie tutti i comandi possibili di VS Code e delle estensioni in una comoda barra di ricerca.",
        wrong: "No. Serve ad accedere a comandi, impostazioni e azioni interne di VS Code."
      }
    },
    {
      q: "Quale combinazione di tasti apre la Command Palette su Windows/Linux?",
      options: [
        "Ctrl + Alt + Canc",
        "Ctrl + Shift + P (oppure F1)",
        "Ctrl + S"
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! La combinazione classica è Ctrl+Shift+P (su macOS Cmd+Shift+P). Puoi usare anche F1.",
        wrong: "No. Ctrl+S salva il file corrente, e Ctrl+Alt+Canc è per le opzioni di sistema."
      }
    },
    {
      q: "Cosa si intende per 'Workspace' (Spazio di lavoro) in VS Code?",
      options: [
        "Una cartella di progetto aperta nell'editor che contiene tutti i file e le configurazioni relative.",
        "Una estensione per condividere lo schermo.",
        "Un servizio cloud a pagamento di Microsoft."
      ],
      correct: 0,
      feedback: {
        correct: "Esatto! Aprire una cartella come Workspace consente a VS Code di indicizzare i file, applicare le ricerche globali e salvare impostazioni personalizzate del progetto.",
        wrong: "No. È semplicemente la cartella principale del tuo progetto aperta dentro l'editor."
      }
    },
    {
      q: "A cosa serve il terminale integrato in VS Code?",
      options: [
        "A navigare su internet senza usare il browser.",
        "Ad eseguire comandi di sistema, build e script npm direttamente dall'editor senza cambiare finestra.",
        "A chattare con l'assistente AI."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Evita di dover cambiare applicazione continuamente per far girare comandi come 'npm run dev' o comandi Git.",
        wrong: "No. Serve ad eseguire righe di comando ed utilità di sviluppo nella directory di progetto corrente."
      }
    },
    {
      q: "Qual è la best practice per l'installazione delle estensioni in VS Code?",
      options: [
        "Installare tutte le estensioni consigliate per scalare le classifiche.",
        "Installare solo le estensioni strettamente necessarie per il proprio flusso di lavoro, mantenendo l'editor leggero.",
        "Installare solo estensioni prodotte da Microsoft."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Avere centinaia di estensioni inattive rallenta l'avvio e il consumo di RAM di VS Code. Installa solo ciò che usi realmente.",
        wrong: "No. Troppe estensioni appesantiscono l'editor compromettendone le prestazioni. Riduci al minimo."
      }
    },
    {
      q: "A cosa serve la funzionalità 'Quick Open' (Ctrl + P)?",
      options: [
        "Ad aprire l'editor in modalità schermo intero.",
        "A cercare ed aprire rapidamente qualsiasi file del progetto digitandone il nome.",
        "A cancellare i file temporanei."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Ctrl+P (Cmd+P su Mac) ti permette di saltare da un file all'altro del progetto digitando solo poche lettere del nome del file.",
        wrong: "No. È il modo più rapido per trovare e saltare a un file specifico della cartella aperta."
      }
    },
    {
      q: "Cosa fa l'estensione 'Prettier' in VS Code?",
      options: [
        "Traduce i commenti del codice in inglese.",
        "Formatta automaticamente il codice per renderlo ordinato e uniforme secondo regole standard.",
        "Controlla la presenza di bug logici prima di eseguire il codice."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Al salvataggio formatta spazi, virgole, a capo ed allineamenti del codice in modo uniforme, sollevandoti da questo compito noioso.",
        wrong: "No. È un formattatore di codice (formatting), non rileva errori logici né effettua traduzioni."
      }
    },
    {
      q: "Qual è lo scopo del pannello 'Source Control' (Controllo del codice sorgente) in VS Code?",
      options: [
        "Archiviare file multimediali.",
        "Gestire le operazioni Git (add, commit, branch) tramite interfaccia grafica.",
        "Compilare i fogli di stile CSS."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Ti permette di fare stage, scrivere messaggi di commit ed effettuare push/pull graficamente senza usare il terminale.",
        wrong: "No. Serve ad interagire visivamente con Git per tracciare e salvare le modifiche del codice."
      }
    },
    {
      q: "Cosa succede se usi la combinazione di tasti Alt + Click (o Option + Click su Mac) in un file di codice?",
      options: [
        "Si cancella la riga selezionata.",
        "Si creano cursori multipli per scrivere contemporaneamente in più punti diversi.",
        "Si apre la guida online del linguaggio."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! I cursori multipli sono eccezionali per fare modifiche identiche su più righe nello stesso istante.",
        wrong: "No. Posiziona un cursore aggiuntivo ad ogni click, permettendoti di scrivere in parallelo."
      }
    },
    {
      q: "A cosa serve il pannello 'Problems' in basso in VS Code?",
      options: [
        "A segnalare problemi di connessione internet del computer.",
        "A mostrare in tempo reale gli errori di sintassi o i warning rilevati nei file aperti.",
        "A inviare segnalazioni di bug al team di VS Code."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Raccoglie tutti i problemi evidenziati dai linter del codice in modo che tu possa risolverli prima della build.",
        wrong: "No. Rileva e mostra gli errori di compilazione e formattazione dei file attivi nel tuo editor."
      }
    }
  ],
  "git-pratico-senza-panico": [
    {
      q: "Qual è lo scopo principale di un sistema di controllo versione come Git?",
      options: [
        "Creare backup manuali in file zip ogni giorno.",
        "Tracciare la cronologia delle modifiche ai file, permettendo di collaborare e tornare indietro nel tempo.",
        "Velocizzare la connessione internet del server."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Git registra ogni modifica dandoti un diario storico del progetto ed una rete di sicurezza per ripristinare file vecchi.",
        wrong: "No. Automatizza il tracciamento storico delle modifiche in modo molto più potente di semplici backup zip."
      }
    },
    {
      q: "In Git, cosa rappresenta il 'Working Tree' (o Working Directory)?",
      options: [
        "Lo stato dei file memorizzato sul server remoto GitHub.",
        "La cartella fisica sul tuo computer dove stai modificando attivamente i file del progetto.",
        "L'elenco dei branch pronti per il merge."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Il working tree contiene i file nello stato attuale in cui li vedi e modifichi sul tuo computer.",
        wrong: "No. Sono i file fisici presenti sul tuo hard disk nella directory di lavoro."
      }
    },
    {
      q: "A cosa serve la 'Staging Area' (o Index) in Git?",
      options: [
        "A pubblicare le modifiche direttamente sul sito web live.",
        "Ad agire come area di preparazione in cui selezioni quali modifiche includere nel prossimo commit.",
        "A cancellare la cronologia recente."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! È la 'sala d'attesa' dei cambiamenti. Quando usi `git add`, sposti i file qui pronti per essere salvati con il commit.",
        wrong: "No. Serve unicamente a preparare ed aggregare i file che verranno salvati definitivamente al successivo commit."
      }
    },
    {
      q: "Cosa fa il comando 'git status'?",
      options: [
        "Mostra lo stato di salute del computer.",
        "Mostra quali file sono stati modificati, quali sono in staging e quali non sono ancora tracciati.",
        "Effettua il push dei commit sul server remoto."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! È il cruscotto fondamentale per capire in ogni istante cosa Git vede modificato e cosa è pronto per il salvataggio.",
        wrong: "No. È un comando puramente informativo sullo stato dei file locali rispetto alla cronologia di Git."
      }
    },
    {
      q: "Qual è lo scopo del comando 'git commit -m \"messaggio\"'?",
      options: [
        "Salvare uno snapshot definitivo delle modifiche preparate in staging, accompagnato da una descrizione.",
        "Scaricare le modifiche dal server remoto.",
        "Creare un nuovo branch di sviluppo."
      ],
      correct: 0,
      feedback: {
        correct: "Esatto! Crea un punto fermo nella cronologia (un commit) con una descrizione dell'intento della modifica.",
        wrong: "No. Salva definitivamente le modifiche presenti in staging area all'interno della storia del repository locale."
      }
    },
    {
      q: "A cosa serve un 'Branch' (ramo) in Git?",
      options: [
        "A creare una copia di backup del database.",
        "A isolare lo sviluppo di una nuova funzionalità o correzione senza intaccare il codice principale (main).",
        "A velocizzare la compilazione di Vite."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Ti permette di lavorare in parallelo senza rischiare di rovinare la versione stabile del codice finché il lavoro non è completato.",
        wrong: "No. Rappresenta una linea di sviluppo parallela per isolare modifiche e funzionalità sperimentali."
      }
    },
    {
      q: "Cosa succede durante un'operazione di 'git merge'?",
      options: [
        "Si cancellano tutti i commit del branch corrente.",
        "Si uniscono le modifiche di un branch secondario all'interno del branch attivo (es. main).",
        "Si esporta il progetto come pacchetto ZIP."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Unisce le cronologie di due rami diversi, integrando il codice del ramo specificato nel ramo in cui ti trovi.",
        wrong: "No. Combina la storia e le modifiche di due rami di sviluppo differenti."
      }
    },
    {
      q: "Qual è la differenza principale tra 'git restore' e 'git revert'?",
      options: [
        "Restore scarta modifiche locali non committate; Revert crea un nuovo commit che annulla gli effetti di un commit passato.",
        "Non c'è differenza, sono comandi identici.",
        "Restore elimina la cronologia di Git; Revert ripristina la cartella node_modules."
      ],
      correct: 0,
      feedback: {
        correct: "Esatto! Restore agisce sull'area di lavoro locale scartando i pasticci correnti. Revert lascia intatto il passato e crea un nuovo commit opposto.",
        wrong: "No. Restore pulisce il working tree locale; Revert scrive un commit correttivo per rimediare a un errore già registrato nella storia."
      }
    },
    {
      q: "Cos'è il 'Reflog' in Git?",
      options: [
        "Un registro locale che tiene traccia di ogni spostamento di HEAD, fungendo da rete di sicurezza per recuperare commit persi.",
        "Il database remoto dei repository di GitHub.",
        "Uno strumento per comprimere le immagini in build."
      ],
      correct: 0,
      feedback: {
        correct: "Esatto! Anche se fai un reset distruttivo, il reflog conserva i riferimenti passati permettendoti di ritrovare e recuperare quasi tutto.",
        wrong: "No. È il diario di bordo segreto dei movimenti di HEAD locali, la massima rete di salvataggio di Git."
      }
    },
    {
      q: "A cosa serve il file '.gitignore'?",
      options: [
        "A velocizzare l'esecuzione dei comandi Git nel terminale.",
        "A specificare quali file o cartelle (es. node_modules, chiavi segrete) Git deve ignorare e non tracciare mai.",
        "A cambiare il tema grafico del terminale."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Evita di sporcare il repository con dipendenze enormi o, peggio, caricare online file privati o chiavi API riservate.",
        wrong: "No. Indica a Git quali file escludere dal tracciamento storico in modo permanente."
      }
    }
  ],
  "github-operativo": [
    {
      q: "Qual è la differenza fondamentale tra Git e GitHub?",
      options: [
        "Git è lo strumento locale di controllo versione; GitHub è una piattaforma cloud che ospita i repository Git online.",
        "GitHub è un linguaggio di programmazione, Git è un editor di testo.",
        "Git funziona solo su Mac, GitHub solo su Windows."
      ],
      correct: 0,
      feedback: {
        correct: "Esatto! Git lavora in locale sulla tua macchina senza internet. GitHub è il servizio web che ti consente di caricare i repository online e collaborare.",
        wrong: "No. Git è il motore locale di tracciamento; GitHub è il cloud server di condivisione e social coding."
      }
    },
    {
      q: "Cosa fa il comando 'git push'?",
      options: [
        "Scarica gli aggiornamenti dal server remoto sul computer locale.",
        "Invia i tuoi commit locali al repository remoto su GitHub per sincronizzarli.",
        "Cancella il branch locale di sviluppo."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! 'Spinge' la tua cronologia locale sul server remoto, rendendo i tuoi commit visibili e scaricabili dagli altri.",
        wrong: "No. Trasferisce i commit locali registrati sul server remoto online (es. GitHub)."
      }
    },
    {
      q: "Cosa fa il comando 'git pull'?",
      options: [
        "Scarica le modifiche dal repository remoto e le unisce direttamente nel tuo branch locale attivo.",
        "Invia le modifiche locali al server GitHub.",
        "Rinomina il repository online."
      ],
      correct: 0,
      feedback: {
        correct: "Esatto! 'Tira' giù le modifiche dal server e aggiorna allineando la tua cartella di lavoro locale (è una scorciatoia per fetch + merge).",
        wrong: "No. Scarica gli aggiornamenti remoti e li integra direttamente nel tuo codice locale attivo."
      }
    },
    {
      q: "A cosa serve una 'Pull Request' (PR) su GitHub?",
      options: [
        "A richiedere lo scaricamento di un archivio ZIP del progetto.",
        "A proporre modifiche da un branch ad un altro, consentendo discussione, revisione del codice e test prima del merge.",
        "A segnalare un bug nel codice di terze parti."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! È la base del lavoro collaborativo: proponi le tue modifiche e permetti ai colleghi di esaminarle e testarle prima di approvarle.",
        wrong: "No. È una richiesta formale di unione codice (merge proposal) arricchita da revisioni, commenti e discussioni."
      }
    },
    {
      q: "Cosa sono le 'Issues' in un progetto GitHub?",
      options: [
        "Errori fatali che impediscono il caricamento del sito.",
        "Uno strumento per tracciare bug, proporre nuove idee, fare domande o organizzare le attività di sviluppo.",
        "I file di log creati automaticamente in fase di build."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Funzionano come bacheca delle attività (to-do list pubblica) per discutere bug o idee di sviluppo del progetto.",
        wrong: "No. Sono schede di segnalazione e tracciamento compiti, problemi ed idee relative al codice."
      }
    },
    {
      q: "A cosa serve il servizio 'GitHub Pages'?",
      options: [
        "A modificare il codice HTML direttamente dal browser.",
        "A ospitare e pubblicare gratuitamente siti web statici direttamente da un repository GitHub.",
        "A memorizzare file di database di grandi dimensioni."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Prende i tuoi file HTML/CSS/JS committati su un branch e li serve come sito web pubblico sotto il dominio github.io.",
        wrong: "No. È il servizio di hosting statico gratuito integrato direttamente in GitHub."
      }
    },
    {
      q: "Cosa si intende per 'Fork' di un repository?",
      options: [
        "La cancellazione del progetto originale.",
        "La creazione di una copia personale del repository di qualcun altro sul proprio account GitHub per fare modifiche liberamente.",
        "L'unione di due repository diversi."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Crea un duplicato online sotto il tuo controllo. Utile per contribuire a progetti open source inviando poi una Pull Request.",
        wrong: "No. Genera una copia identica del repository originale associata al tuo account personale."
      }
    },
    {
      q: "Cosa sono le 'GitHub Actions'?",
      options: [
        "Scorciatoie da tastiera per velocizzare l'uso del sito.",
        "Un sistema di automazione (CI/CD) che esegue script (es. test, build, deploy) in risposta ad eventi come il push.",
        "Estensioni grafiche per cambiare il tema di GitHub."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Consentono di automatizzare flussi complessi, come compilare il codice di produzione o lanciare i test ogni volta che fai push.",
        wrong: "No. Sono workflow automatizzati eseguiti sui server di GitHub per compilare, testare o pubblicare il codice."
      }
    },
    {
      q: "Perché è pericoloso committare file come '.env' o chiavi API su GitHub?",
      options: [
        "Perché aumentano eccessivamente la dimensione del repository.",
        "Perché i repository (specie se pubblici) vengono scansionati da bot pronti a rubare credenziali e sfruttarle abusivamente.",
        "Perché Vite segnalerà un errore di build."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Ci sono bot automatici che scandagliano continuamente GitHub alla ricerca di credenziali di AWS, database o API di pagamento per sfruttarle a tue spese in pochi secondi.",
        wrong: "No. È un gravissimo rischio di sicurezza perché esponi credenziali private ad accessi non autorizzati."
      }
    },
    {
      q: "Come si clona un repository da GitHub sul proprio computer?",
      options: [
        "Copiando i file uno ad uno tramite drag and drop.",
        "Utilizzando il comando 'git clone' seguito dall'URL del repository.",
        "Scaricano l'applicazione desktop di GitHub e trascinando la cartella."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Il comando `git clone URL` scarica l'intera cronologia dei file locali agganciando in automatico il server remoto origin.",
        wrong: "No. `git clone` è il comando corretto per scaricare ed inizializzare una copia locale del repository online."
      }
    }
  ],
  "browser-devtools": [
    {
      q: "Come si aprono solitamente gli Strumenti per Sviluppatori (DevTools) nella maggior parte dei browser?",
      options: [
        "Premendo il tasto F12 o cliccando con il tasto destro e scegliendo 'Ispeziona'.",
        "Premendo la barra spaziatrice per 5 secondi.",
        "Riavviando il browser in modalità provvisoria."
      ],
      correct: 0,
      feedback: {
        correct: "Esatto! F12 o tasto destro -> Ispeziona sono i modi universali per richiamare la console e l'ispezione elementi.",
        wrong: "No. Si aprono tramite la scorciatoia F12 o tramite il menu contestuale del click destro del mouse."
      }
    },
    {
      q: "A cosa serve principalmente il pannello 'Elements' (o Elementi) delle DevTools?",
      options: [
        "A vedere l'elenco dei cookie salvati dal sito.",
        "A esplorare e modificare in tempo reale la struttura DOM (HTML) e le regole CSS applicate agli elementi.",
        "A testare la velocità di download della connessione."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Ti permette di analizzare la struttura HTML attiva e vedere esattamente quali fogli di stile stanno influenzando la grafica di ogni tag.",
        wrong: "No. Serve ad ispezionare visivamente la struttura dell'albero HTML (DOM) e modificare il CSS al volo."
      }
    },
    {
      q: "Cosa succede se modifichi del testo o una regola CSS nel pannello Elements delle DevTools?",
      options: [
        "La modifica viene salvata in modo permanente nel codice sorgente sul tuo computer.",
        "La modifica è solo temporanea e visibile sul tuo browser; sparirà ricaricando la pagina.",
        "La modifica viene pubblicata online per tutti gli utenti."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! È un ambiente di prova volatile. Ricaricando la pagina (F5) tutto torna allo stato originale definito dal codice sorgente reale.",
        wrong: "No. Le modifiche sono locali e temporanee, utili per fare esperimenti grafici rapidi prima di scrivere sul codice vero."
      }
    },
    {
      q: "Qual è la funzione della 'Console' nelle DevTools?",
      options: [
        "Riprodurre file audio del sito.",
        "Mostrare gli errori JavaScript, i warning del browser e consentire l'esecuzione di codice JS al volo.",
        "Configurare il server proxy."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! È l'interfaccia a riga di comando per dialogare con JavaScript ed intercettare errori di rendering o di logica.",
        wrong: "No. Mostra i log e i messaggi di errore del codice JavaScript, e permette di testare script in tempo reale."
      }
    },
    {
      q: "Nel pannello Network delle DevTools, cosa indicano le singole righe?",
      options: [
        "Le estensioni installate nel browser.",
        "Tutte le richieste HTTP effettuate dalla pagina per caricare risorse (HTML, CSS, JS, immagini, API) e i relativi tempi.",
        "I dispositivi connessi alla rete Wi-Fi di casa."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Ti mostra cosa sta rallentando il sito e se ci sono immagini rotte o risorse non trovate (errori 404).",
        wrong: "No. Registra e riassume ogni singola chiamata di rete effettuata dal browser per caricare il sito."
      }
    },
    {
      q: "A cosa serve la funzionalità di 'Emulazione Dispositivi Mobili' (icona a forma di telefono/tablet)?",
      options: [
        "A fare telefonate dal computer.",
        "A testare la responsività della pagina simulando diverse risoluzioni di schermo e comportamenti touch.",
        "A scaricare l'app mobile del sito."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Simula schermi di telefoni popolari (es. iPhone, Pixel) permettendoti di correggere bug grafici da mobile senza usare lo smartphone.",
        wrong: "No. Serve a ridimensionare l'area di rendering del browser per testare l'adattabilità responsive del layout."
      }
    },
    {
      q: "Nel pannello Elements, cosa indica una regola CSS sbarrata con una linea?",
      options: [
        "Che la regola è stata scritta male ed ha un errore di sintassi.",
        "Che la regola è stata sovrascritta da un'altra regola con specificità o ordine superiore nella cascata.",
        "Che la regola rallenta il caricamento del browser."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Indica che la regola è stata superata (ad esempio da una classe più specifica o da regole scritte più in basso nel foglio di stile).",
        wrong: "No. Significa che la cascata del CSS ha dato priorità ad una regola concorrente, disattivando questa."
      }
    },
    {
      q: "A cosa serve il pannello 'Application' (o Applicazione)?",
      options: [
        "A scaricare nuovi programmi sul computer.",
        "A ispezionare le risorse memorizzate localmente come LocalStorage, SessionStorage, Cookie e Service Worker.",
        "A configurare il codice sorgente."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! È il magazzino dati del browser. Ti permette di vedere le preferenze memorizzate o eliminare la cache della PWA.",
        wrong: "No. Serve ad ispezionare e cancellare i database e i sistemi di archiviazione locali della pagina web."
      }
    },
    {
      q: "Cosa fa la scheda 'Lighthouse' integrata nelle DevTools di Chrome?",
      options: [
        "Genera report automatici su performance, accessibilità, best practice e SEO della pagina analizzata.",
        "Blocca gli annunci pubblicitari del sito.",
        "Trova i collegamenti interrotti verso altri siti."
      ],
      correct: 0,
      feedback: {
        correct: "Esatto! Misura la velocità di caricamento, la compatibilità SEO ed a11y, suggerendo interventi precisi per ottimizzare la pagina.",
        wrong: "No. È il tool ufficiale per effettuare audit di performance ed ottimizzazione della pagina."
      }
    },
    {
      q: "Nel pannello Sources (Sorgenti), a cosa serve inserire un 'Breakpoint'?",
      options: [
        "A interrompere la connessione di rete della pagina.",
        "A mettere in pausa l'esecuzione di JavaScript in una riga precisa per analizzare lo stato delle variabili.",
        "A definire i punti di interruzione responsivi del CSS."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Congela JavaScript in esecuzione su quella riga, consentendoti di ispezionare le variabili passo-passo senza usare console.log.",
        wrong: "No. Serve a fermare temporaneamente il flusso logico degli script per analizzare bug e comportamenti delle variabili."
      }
    }
  ],
  "npm-vite-struttura-progetto": [
    {
      q: "Cos'è NPM (Node Package Manager)?",
      options: [
        "Un motore di ricerca per programmatori.",
        "Il gestore di pacchetti predefinito per Node.js, usato per installare, condividere e gestire le dipendenze di un progetto.",
        "Un framework CSS alternativo a Tailwind."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Funziona come app store delle librerie per sviluppatori JavaScript, consentendoti di integrare pacchetti esterni con facilità.",
        wrong: "No. È lo strumento a riga di comando per scaricare, installare ed aggiornare pacchetti e dipendenze nel codice."
      }
    },
    {
      q: "A cosa serve il file 'package.json' in un progetto?",
      options: [
        "A contenere il codice sorgente dell'applicazione.",
        "A definire i metadati del progetto, gli script di avvio e l'elenco delle dipendenze necessarie.",
        "A memorizzare i dati degli utenti registrati."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! È il certificato di identità del progetto. Senza di esso, NPM non sa quali dipendenze scaricare né quali script eseguire.",
        wrong: "No. Contiene le informazioni di configurazione, i pacchetti richiesti ed i comandi (script) di build/sviluppo."
      }
    },
    {
      q: "Cosa fa il comando 'npm install' eseguito in una cartella con un 'package.json'?",
      options: [
        "Crea un backup del database locale.",
        "Scarica ed installa tutte le dipendenze elencate nel package.json all'interno della cartella node_modules.",
        "Avvia il server di produzione su AWS."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Legge le voci del package.json e scarica i file fisici dei pacchetti necessari per far funzionare l'applicazione.",
        wrong: "No. Scarica ed organizza localmente i pacchetti di codice richiesti dal progetto nella cartella di installazione."
      }
    },
    {
      q: "Cos'è la cartella 'node_modules'?",
      options: [
        "La cartella in cui si salvano le immagini ottimizzate per il sito.",
        "La directory in cui NPM installa fisicamente tutti i pacchetti di codice e le relative sotto-dipendenze del progetto.",
        "Il database in cui risiedono i file HTML pronti per la pubblicazione."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! È la cartella che ospita tutto il codice JavaScript scaricato da internet necessario alle librerie del tuo progetto. Può diventare molto grande.",
        wrong: "No. Ospita tutti i codici sorgente dei pacchetti e moduli esterni installati da NPM."
      }
    },
    {
      q: "Perché la cartella 'node_modules' non va MAI caricata su Git/GitHub?",
      options: [
        "Perché contiene file segreti contenenti dati di pagamento.",
        "Perché è gigantesca e può essere rigenerata in qualsiasi momento lanciando semplicemente il comando 'npm install'.",
        "Perché Git non supporta file scritti in JavaScript."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Caricarla rallenta Git ed intasa il repository. Chiunque scarichi il tuo progetto può ricrearla semplicemente lanciando `npm install` sul proprio computer.",
        wrong: "No. Si esclude sempre via `.gitignore` per evitare di caricare giga di dipendenze riscaricabili con un solo comando."
      }
    },
    {
      q: "A cosa serve il file 'package-lock.json'?",
      options: [
        "A bloccare l'accesso al file package.json tramite password.",
        "A registrare le versioni esatte di tutte le dipendenze installate per garantire che il progetto si compili allo stesso identico modo su ogni macchina.",
        "A nascondere le dipendenze vulnerabili."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Fissa (locka) le sotto-dipendenze in modo che se un programmatore scarica il progetto dopo mesi, userà le medesime versioni prevenendo crash.",
        wrong: "No. Assicura che l'albero delle dipendenze installate rimanga identico per tutti i programmatori del team."
      }
    },
    {
      q: "Cos'è Vite.js?",
      options: [
        "Un database relazionale SQL leggero.",
        "Un build tool moderno ed estremamente veloce usato per lo sviluppo e la compilazione di applicazioni web.",
        "Un servizio di hosting cloud gratuito."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Vite gestisce lo sviluppo locale servendo i file istantaneamente e compila gli asset minimizzandoli per la produzione.",
        wrong: "No. È il bundler e server di sviluppo moderno che sostituisce vecchi strumenti come Webpack."
      }
    },
    {
      q: "Qual è la differenza tra 'devDependencies' e 'dependencies' nel package.json?",
      options: [
        "devDependencies servono solo durante lo sviluppo e la build (es. Vite, compilatori); dependencies sono necessarie anche al funzionamento dell'app online.",
        "dependencies contiene file CSS, devDependencies contiene file JS.",
        "Non c'è differenza, sono suddivisioni puramente estetiche."
      ],
      correct: 0,
      feedback: {
        correct: "Esatto! Strumenti come Vite, linter o compilatori di test servono solo allo sviluppatore (dev) e non vanno inclusi nel codice finale di produzione.",
        wrong: "No. Le prime sono utilità per lo sviluppatore; le seconde sono pacchetti logici necessari all'applicazione a runtime."
      }
    },
    {
      q: "Cosa fa il comando 'npm run dev' in un progetto Vite?",
      options: [
        "Compila il pacchetto di produzione pronto per l'hosting.",
        "Avvia un server locale di sviluppo ultra-veloce con Hot Module Replacement (aggiornamento istantaneo al salvataggio).",
        "Effettua la scansione di sicurezza dei file del progetto."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Avvia il server locale per vedere le modifiche nel browser in tempo reale mentre scrivi codice.",
        wrong: "No. Avvia l'ambiente locale interattivo per lo sviluppo rapido del codice."
      }
    },
    {
      q: "Cosa fa il comando 'npm run build'?",
      options: [
        "Installa nuove estensioni in VS Code.",
        "Compila, ottimizza, minimizza e sposta i file di sorgente all'interno di una cartella di distribuzione (di solito 'dist/') pronta per la pubblicazione.",
        "Inizializza un nuovo repository Git locale."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Trasforma i tuoi file sorgente grezzi in file compressi ad altissime performance pronti per essere pubblicati online sul server di hosting.",
        wrong: "No. Crea la versione ottimizzata finale dei file del sito (compilazione/bundling) per la pubblicazione in produzione."
      }
    }
  ],
  "deploy-base": [
    {
      q: "Cosa si intende per 'Deploy' (o Deployment) di un sito web?",
      options: [
        "La scrittura del codice HTML all'interno dell'editor.",
        "Il processo di pubblicazione e trasferimento dei file del sito su un server web per renderlo accessibile su internet.",
        "L'acquisto di un dominio personalizzato."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Fare il deploy significa spostare fisicamente il codice compilato dal tuo computer ad un server pubblico accessibile globalmente.",
        wrong: "No. È il passaggio logico di rilascio del codice dai computer locali ai server pubblici online."
      }
    },
    {
      q: "Qual è la differenza tra Hosting e Dominio?",
      options: [
        "L'hosting è lo spazio fisico sul server dove risiedono i file; il dominio è l'indirizzo testuale (es. codedge.it) usato dagli utenti per raggiungerlo.",
        "L'hosting si paga annualmente, il dominio è sempre gratuito.",
        "Il dominio è il database, l'hosting è il codice JavaScript."
      ],
      correct: 0,
      feedback: {
        correct: "Esatto! L'hosting è la 'casa' dei file, il dominio è il 'citofono' (il nome testuale associato all'IP) per bussare.",
        wrong: "No. L'hosting memorizza ed esegue i file; il dominio è il nome indirizzo testuale per facilitare la ricerca."
      }
    },
    {
      q: "Cos'è un sito web statico?",
      options: [
        "Un sito che non ha alcuna animazione o transizione CSS.",
        "Un sito composto da file pronti (HTML, CSS, JS, immagini) serviti direttamente all'utente così come sono, senza elaborazione lato server.",
        "Un sito che si apre solo da computer e non da cellulare."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Non richiede database dinamici a runtime (come WordPress o PHP): il server invia i file del client esattamente come sono.",
        wrong: "No. Indica un sito privo di logica dinamica lato server. I file sono pre-compilati e pronti all'uso."
      }
    },
    {
      q: "Quale delle seguenti piattaforme è ideale e gratuita per ospitare siti statici?",
      options: [
        "WordPress.com",
        "GitHub Pages, Netlify o Vercel.",
        "AWS EC2 senza configurazione."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Queste piattaforme si agganciano a GitHub ed effettuano build e deploy automatici e veloci a costo zero per progetti statici.",
        wrong: "No. GitHub Pages, Netlify o Vercel offrono hosting statico gratuito automatizzato eccezionale."
      }
    },
    {
      q: "In un server web per siti statici, qual è solitamente il nome del file principale cercato di default nella root?",
      options: [
        "`main.js`",
        "`index.html`",
        "`home.css`"
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! I server web cercano di default 'index.html' per caricare la pagina iniziale se non viene specificata una risorsa esplicita.",
        wrong: "No. Il file d'ingresso universale cercato dai server è sempre 'index.html'."
      }
    },
    {
      q: "A cosa serve un certificato SSL (HTTPS)?",
      options: [
        "A velocizzare la velocità di download dei file del sito.",
        "A crittografare la connessione tra browser e server, garantendo sicurezza dei dati ed indicizzazione favorevole su Google.",
        "A nascondere il codice sorgente agli ispettori."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Protegge i dati in transito (es. password o dati di form) ed evita che Chrome mostri la scritta rossa 'Sito non sicuro'.",
        wrong: "No. Assicura che i dati scambiati tra utente e server siano criptati, migliorando fiducia e posizionamento SEO."
      }
    },
    {
      q: "Cosa sono i 'DNS' (Domain Name System)?",
      options: [
        "I file di configurazione delle estensioni del browser.",
        "Il sistema che traduce i nomi di dominio leggibili (es. google.com) nei rispettivi indirizzi IP numerici dei server.",
        "I pacchetti NPM per la compilazione."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Funzionano come rubrica telefonica di internet, traducendo nomi facili da ricordare in coordinate numeriche IP.",
        wrong: "No. Traduce i domini testuali nei server IP reali ad essi collegati."
      }
    },
    {
      q: "Nel flusso di deploy di un'app moderna, a cosa serve la cartella 'dist/' (oppure 'build/')?",
      options: [
        "A ospitare le versioni di backup dei file non ottimizzati.",
        "Contiene il codice minimizzato, ottimizzato e pronto all'uso generato dal comando di build, ed è l'unica cartella da caricare sull'hosting.",
        "A configurare le variabili d'ambiente segrete."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! È il distillato del tuo codice sorgente. È leggera, priva di node_modules, e contiene solo ciò che serve online.",
        wrong: "No. È il traguardo della build: contiene i file compressi e ottimizzati destinati alla pubblicazione."
      }
    },
    {
      q: "Cosa si intende per 'Continuous Deployment' (Deploy Continuo)?",
      options: [
        "Il caricamento manuale dei file tramite client FTP ogni sera.",
        "Un sistema automatico che aggiorna il sito live ogni volta che effettui un push di nuovi commit sul branch principale di GitHub.",
        "Il rinnovo automatico del pagamento dell'hosting."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Ti basta lanciare `git push` ed i server online si accorgono del cambio, ricompilano e aggiornano il sito pubblico in pochi secondi.",
        wrong: "No. Sincronizza ed esegue la pubblicazione online in automatico a partire dal codice caricato su GitHub."
      }
    },
    {
      q: "Qual è il rischio di modificare i file direttamente sul server di produzione (es. via FTP)?",
      options: [
        "Che il computer locale si spenga improvvisamente.",
        "Creare disallineamenti con il codice sorgente locale, rischiando di sovrascrivere o perdere le modifiche al successivo deploy automatico.",
        "Che il browser dell'utente rifiuti di aprire la pagina."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Le modifiche verrebbero cancellate al primo deploy automatico da GitHub. Il codice sorgente reale deve sempre risiedere su Git.",
        wrong: "No. Rischia di rompere l'allineamento con il repository locale, portando alla perdita dei cambiamenti alla build successiva."
      }
    }
  ],
  "seo-tecnico-base": [
    {
      q: "Cos'è la SEO (Search Engine Optimization)?",
      options: [
        "Il processo di scrittura di codice JavaScript per rendere il sito PWA.",
        "L'insieme di tecniche per ottimizzare un sito e migliorarne la visibilità e il posizionamento nei risultati organici dei motori di ricerca.",
        "Un protocollo di sicurezza per proteggere i dati degli utenti."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Serve a far capire a motori come Google di cosa parla il tuo sito, facendolo apparire a chi cerca parole chiave correlate.",
        wrong: "No. Ottimizza la rilevanza ed il posizionamento del sito nei risultati non a pagamento dei motori di ricerca."
      }
    },
    {
      q: "Perché il tag '&lt;title&gt;' è considerato uno degli elementi SEO più importanti?",
      options: [
        "Porque definisce il colore del font del titolo principale.",
        "Perché compare nei risultati di ricerca di Google come titolo cliccabile ed indica chiaramente il tema della pagina.",
        "Perché è l'unico tag HTML obbligatorio in assoluto."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! È il primo elemento letto dai crawler e la prima cosa che salta all'occhio dell'utente nei risultati di ricerca.",
        wrong: "No. È il titolo blu cliccabile visualizzato sui motori di ricerca, fondamentale per attirare click ed indicizzare."
      }
    },
    {
      q: "A cosa serve il tag meta description?",
      options: [
        "A fornire a Google un riassunto della pagina che spesso compare come estratto (snippet) sotto il titolo nei risultati di ricerca.",
        "A caricare i font di Google pre-collegati.",
        "A definire l'immagine di copertina del sito."
      ],
      correct: 0,
      feedback: {
        correct: "Esatto! Anche se non influenza direttamente il ranking matematico, una buona description convince le persone a cliccare sul tuo link.",
        wrong: "No. È il testo descrittivo grigio mostrato sotto il titolo blu nei risultati di ricerca di Google."
      }
    },
    {
      q: "Cos'è il tag 'canonical' (&lt;link rel=\"canonical\" href=\"...\"&gt;)?",
      options: [
        "Un tag per rendere il sito compatibile con i dispositivi mobili.",
        "Un'indicazione per i motori di ricerca che dichiara l'URL ufficiale di una pagina, prevenendo problemi di contenuti duplicati.",
        "Il tag per collegare il file di stile CSS principale."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Se una pagina è accessibile da più URL, il canonical indica a Google quale indicizzare, evitando penalizzazioni per testi doppi.",
        wrong: "No. Specifica l'indirizzo URL principale 'preferito' per prevenire il problema dei contenuti duplicati."
      }
    },
    {
      q: "Cos'è la 'Sitemap' di un sito web?",
      options: [
        "Una mappa grafica interattiva per aiutare gli utenti a non perdersi.",
        "Un file XML che elenca tutte le URL del sito per aiutare i crawler dei motori di ricerca a scansionare ed indicizzare le pagine.",
        "Lo schema del database MySQL del server."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! È l'indice del sito destinato a Google. Segnala l'esistenza di ogni pagina per velocizzare l'indicizzazione.",
        wrong: "No. È un file dati in formato XML che elenca gli indirizzi delle pagine attive per agevolare i motori di ricerca."
      }
    },
    {
      q: "A cosa serve il file 'robots.txt'?",
      options: [
        "A bloccare gli attacchi degli hacker sul server.",
        "A fornire istruzioni ai crawler dei motori di ricerca su quali aree o pagine del sito non devono scansionare ed indicizzare.",
        "A configurare le risposte automatiche della chat di assistenza."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Serve a limitare l'accesso a cartelle private o amministrative (es. `/admin/`), risparmiando risorse di scansione.",
        wrong: "No. È la guida per i crawler robot che definisce quali zone del sito non vanno esplorate né catalogate."
      }
    },
    {
      q: "Cosa sono le 'Social Card' (protocollo Open Graph)?",
      options: [
        "Carte di credito speciali per fare acquisti sui social network.",
        "Metadati (titolo, descrizione, immagine) che definiscono come appare il link del tuo sito quando viene condiviso sui social.",
        "Le icone utilizzate nella barra dei menu."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Definiscono i tag og:title, og:image, ecc., controllando l'aspetto estetico dei link inviati su WhatsApp, Facebook o Telegram.",
        wrong: "No. Gestiscono i metadati visivi di anteprima visualizzati in caso di condivisione social dei link."
      }
    },
    {
      q: "In che modo le performance di caricamento (velocità del sito) influenzano la SEO?",
      options: [
        "Non hanno alcuna influenza, Google valuta solo i testi.",
        "Un sito lento offre una pessima UX, aumentando il tasso di abbandono, ed è penalizzato da Google nei posizionamenti.",
        "Velocizzano l'indicizzazione a scapito della sicurezza."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Google ha inserito la velocità di caricamento (Core Web Vitals) come fattore ufficiale di posizionamento sul motore.",
        wrong: "No. La lentezza rovina l'esperienza di navigazione portando a penalità dirette sul posizionamento SEO."
      }
    },
    {
      q: "Cos'è la Google Search Console?",
      options: [
        "Un'estensione di Chrome per modificare i tag SEO.",
        "Uno strumento gratuito di Google che permette di monitorare la presenza, l'indicizzazione, gli errori e il traffico di ricerca del proprio sito.",
        "Il server cloud su cui risiede il motore di ricerca di Google."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Ti avvisa se ci sono pagine non indicizzate, errori di scansione e ti mostra quali parole chiave usano gli utenti per trovarti.",
        wrong: "No. È il cruscotto diagnostico di Google per monitorare e ottimizzare l'indicizzazione organica reale."
      }
    },
    {
      q: "Cosa si intende per 'SEO Mobile-Friendly'?",
      options: [
        "Creare un'app mobile scaricabile dagli store Google e Apple.",
        "Progettare e ottimizzare il sito affinché si legga e navighi perfettamente su smartphone, criterio fondamentale per l'indicizzazione di Google.",
        "Inserire il prefisso telefonico nei contatti."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Google applica la scansione 'Mobile-First': analizza il sito partendo dalla versione per cellulare. Se non si legge bene da mobile, non salirà.",
        wrong: "No. Significa ottimizzare usabilità e caricamento del sito web per la navigazione da smartphone."
      }
    }
  ],
  "accessibilita-web-base": [
    {
      q: "Cosa si intende per 'Accessibilità Web' (a11y)?",
      options: [
        "Rendere il sito navigabile solo a chi possiede una connessione internet ultra-veloce.",
        "Progettare siti web fruibili da chiunque, incluse persone con disabilità fisiche, cognitive, sensoriali o temporanee.",
        "Proteggere il sito tramite password e sistemi di login sicuri."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Significa rimuovere le barriere digitali per garantire l'uso del sito anche ad utenti non vedenti, ipovedenti, motori o sordi.",
        wrong: "No. È l'inclusione digitale per consentire a chiunque (indipendentemente da limitazioni) di navigare con successo."
      }
    },
    {
      q: "In che modo l'HTML Semantico aiuta l'accessibilità?",
      options: [
        "Rende il codice più colorato e facile da leggere in VS Code.",
        "Consente agli screen reader (lettori di schermo usati dai non vedenti) di capire e comunicare la struttura della pagina (es. navigazione, articolo, form).",
        "Velocizza il tempo di caricamento del browser."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Uno screen reader sa che un pulsante `<button>` fa un'azione, mentre un `<div>` con un click handler è invisibile per lui.",
        wrong: "No. Dà una struttura logica riconoscibile dai dispositivi assistiti per la lettura vocale della pagina."
      }
    },
    {
      q: "Qual è lo scopo primario dell'attributo 'alt' nei tag delle immagini?",
      options: [
        "Indicare il percorso del file dell'immagine sul server.",
        "Forinre una descrizione testuale alternativa dell'immagine che viene letta dagli screen reader per gli utenti non vedenti.",
        "Definire le dimensioni visive dell'immagine a schermo."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Permette a chi non può vedere l'immagine di capirne l'utilità ed il significato all'interno della pagina.",
        wrong: "No. È il testo alternativo letto vocalmente in sostituzione dell'immagine per chi usa screen reader."
      }
    },
    {
      q: "Perché è importante che il contrasto tra il colore del testo e lo sfondo sia sufficientemente alto?",
      options: [
        "Per rendere il sito conforme alle linee guida di stile di Apple.",
        "Per garantire la leggibilità del testo a persone con disabilità visive (es. daltonismo) o in condizioni di forte luce solare.",
        "Per ridurre il consumo di batteria del monitor."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Un contrasto basso (es. testo grigio chiaro su bianco) rende il sito faticoso da leggere per tutti, specie per ipovedenti o schermi all'aperto.",
        wrong: "No. Assicura una leggibilità ottimale per chiunque, prevenendo affaticamento visivo."
      }
    },
    {
      q: "Cosa si intende per 'Navigabilità tramite tastiera'?",
      options: [
        "La capacità dell'utente di digitare testo molto velocemente.",
        "La possibilità di navigare ed interagire con tutti gli elementi del sito (link, bottoni, form) usando solo il tasto Tab e Invio.",
        "L'uso di scorciatoie da tastiera in VS Code."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Chi ha disabilità motorie non può usare il mouse. Deve poter fare tutto saltando da un link all'altro premendo Tab.",
        wrong: "No. Permette a chi ha difficoltà motorie o non usa il mouse di completare azioni sul sito con la sola tastiera."
      }
    },
    {
      q: "A cosa serve l'indicatore grafico di 'Focus' (solitamente un bordo colorato) sugli elementi attivi?",
      options: [
        "A decorare la pagina con bordi colorati casuali.",
        "A mostrare visivamente a chi naviga tramite tastiera quale elemento (link o pulsante) è attualmente selezionato.",
        "A nascondere il cursore del mouse."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! È l'equivalente visivo del puntatore del mouse. Rimuoverlo rende impossibile capire dove si è posizionati.",
        wrong: "No. È il puntatore visivo per la tastiera: evidenzia l'elemento attivo durante lo spostamento con Tab."
      }
    },
    {
      q: "Cosa sono le linee guida 'WCAG' (Web Content Accessibility Guidelines)?",
      options: [
        "I regolamenti legali per l'acquisto di domini internet.",
        "Gli standard internazionali di riferimento che definiscono i requisiti per rendere i contenuti web accessibili.",
        "I pacchetti NPM di ottimizzazione CSS."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Sono gli standard redatti dal W3C divisi in livelli (A, AA, AAA) usati per misurare la conformità legale dell'accessibilità.",
        wrong: "No. È la specifica tecnica internazionale di riferimento per la conformità di accessibilità."
      }
    },
    {
      q: "Perché è un errore grave rimuovere l'outline del focus ('outline: none' o 'outline: 0') senza fornire un'alternativa visiva nel CSS?",
      options: [
        "Perché Vite segnalerà un errore bloccante in compilazione.",
        "Perché rende il sito inutilizzabile per chi naviga tramite tastiera, in quanto non saprà mai dove si trova nella pagina.",
        "Perché riduce la SEO del sito su Google."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Se nascondi l'outline, chi naviga con tastiera andrà alla cieca, rendendo il sito impraticabile. Se lo rimuovi, sostituiscilo con uno stile `:focus` personalizzato.",
        wrong: "No. Rende cieca la navigazione via tastiera, escludendo una fetta importante di utenti."
      }
    },
    {
      q: "Nei moduli (form), perché ogni campo deve essere associato a un tag '&lt;label&gt;' visibile?",
      options: [
        "Per ingrandire l'area cliccabile del campo e comunicare chiaramente lo scopo dell'input agli screen reader.",
        "Per colorare lo sfondo del campo in caso di errore.",
        "Per inviare i dati al database in modo crittografato."
      ],
      correct: 0,
      feedback: {
        correct: "Esatto! Cliccare sulla label sposta il cursore sull'input, e lo screen reader leggerà il testo della label non appena l'utente seleziona il campo.",
        wrong: "No. Collega il testo descrittivo al campo corrispondente, migliorando area cliccabile e lettura assistita."
      }
    },
    {
      q: "Cosa indica l'attributo ARIA 'aria-hidden=\"true\"'?",
      options: [
        "Che l'elemento deve essere nascosto visivamente dallo schermo per tutti gli utenti.",
        "Che l'elemento ha una funzione puramente decorativa e deve essere ignorato dagli screen reader per non creare confusione.",
        "Che l'elemento contiene dati segreti di amministrazione."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Se un elemento (es. un'icona decorativa accanto al testo) non aggiunge informazioni, `aria-hidden=\"true\"` evita che il lettore vocale lo pronunci inutilmente.",
        wrong: "No. Nasconde l'elemento all'albero dell'accessibilità degli screen reader, lasciandolo visibile a schermo."
      }
    }
  ],
  "ai-sviluppo-solido": [
    {
      q: "Qual è il rischio principale di affidarsi ciecamente alla generazione di codice tramite AI?",
      options: [
        "Che l'editor di testo si disinstalli automaticamente.",
        "Introdurre bug logici latenti, codice ridondante o falle di sicurezza senza accorgersene per mancanza di revisione critica.",
        "Pagare tariffe eccessive per il traffico internet."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! L'AI genera codice basandosi su probabilità statistiche, non su reale comprensione del tuo sistema; necessita sempre di verifica umana.",
        wrong: "No. È il rischio di importare bug silenziosi o falle di sicurezza per pigrizia nella revisione del codice."
      }
    },
    {
      q: "Cosa si intende per 'Prompt Engineering' nello sviluppo software?",
      options: [
        "La compilazione dei moduli di assistenza dell'AI.",
        "L'arte di formulare istruzioni chiare, contestualizzate e vincolate per ottenere dall'AI codice preciso e mirato.",
        "L'installazione di server di intelligenza artificiale sul computer."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Fornire esempi, regole sintattiche e contesti chiari istruisce l'AI a generare codice di qualità superiore e aderente al tuo stile.",
        wrong: "No. Consiste nello strutturare la richiesta (input) per ottenere risposte (output) ottimali e coerenti."
      }
    },
    {
      q: "Come andrebbe integrato un assistente AI (es. Copilot) nel flusso di lavoro quotidiano?",
      options: [
        "Lasciando che scriva interi file di codice senza mai ispezionarli.",
        "Come copilota per velocizzare compiti ripetitivi (boilerplates, test unitari) mantenendo sempre la supervisione e la guida logica del codice.",
        "Utilizzandolo solo per fare ricerche su Google."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! L'AI eccelle nella velocità di scrittura del codice di contorno, ma la logica del sistema e la responsabilità restano del programmatore.",
        wrong: "No. Va visto come assistente junior velocizzatore, tenendo fermo il controllo decisionale umano."
      }
    },
    {
      q: "Perché è importante fornire 'contesto' all'AI quando si fa una richiesta?",
      options: [
        "Per evitare che il server dell'AI vada in timeout.",
        "Per consentire all'AI di generare codice compatibile con lo stack, le convenzioni e l'architettura specifica del tuo progetto.",
        "Per aumentare la velocità di risposta della chat."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Senza contesto, l'AI proporrà risposte generiche che potrebbero non funzionare o contrastare con le regole del tuo codice.",
        wrong: "No. Permette di ottenere codice coerente con le librerie e la struttura specifica già in uso."
      }
    },
    {
      q: "Cosa si intende per 'Revisione Critica' del codice generato dall'AI?",
      options: [
        "L'invio del codice a un collega senior prima del deploy.",
        "Leggere, comprendere riga per riga e testare il codice generato prima di integrarlo, verificando che sia sicuro e corretto.",
        "L'uso di un debugger automatico."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Non devi mai incorporare codice che non capisci. Devi analizzarlo come se lo avesse scritto qualcun altro, trovando potenziali debolezze.",
        wrong: "No. È il controllo minuzioso e consapevole del codice ricevuto prima di approvarne l'inserimento nel progetto."
      }
    },
    {
      q: "A cosa servono i vincoli (es. 'usa solo vanilla JS', 'niente librerie esterne') in un prompt?",
      options: [
        "A ridurre l'impronta di carbonio del server dell'AI.",
        "A guidare l'AI nella generazione di soluzioni conformi alle regole e limitazioni del progetto, evitando codice inutile.",
        "A velocizzare la compilazione di Vite."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Delimitano lo spazio delle risposte possibili, evitando che l'AI proponga dipendenze non volute o metodi non compatibili.",
        wrong: "No. Costringono l'AI a generare risposte conformi alle specifiche tecniche predefinite del progetto."
      }
    },
    {
      q: "Qual è una best practice per risolvere un bug complesso con l'aiuto dell'AI?",
      options: [
        "Copiare l'intero progetto nella chat dell'AI senza spiegazioni.",
        "Isolare il bug, fornire lo snippet di codice interessato, descrivere il comportamento atteso ed incollare l'errore esatto del terminale.",
        "Ignorare l'AI e riscrivere il codice da zero."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Fornire dati puliti (codice sorgente + errore esatto del compilatore) permette all'AI di individuare il problema molto più rapidamente.",
        wrong: "No. L'isolamento del problema unito al log dell'errore è il modo migliore per orientare l'AI alla soluzione."
      }
    },
    {
      q: "Perché non si dovrebbero mai incollare dati sensibili (es. password, chiavi API o dati di clienti) nei prompt dell'AI?",
      options: [
        "Perché i server dell'AI rifiutano richieste contenenti numeri di telefono.",
        "Perché tali dati vengono inviati a server di terze parti e potrebbero essere riutilizzati per addestrare i modelli, rischiando fughe di dati.",
        "Perché aumenta il costo della sottoscrizione mensile."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! I tuoi prompt vengono memorizzati e potrebbero comparire nelle risposte fornite ad altri utenti in futuro. Attenzione alla privacy.",
        wrong: "No. Rappresenta una violazione di sicurezza dei dati sensibili che vengono inviati all'esterno del tuo ambiente protetto."
      }
    },
    {
      q: "In che modo l'AI può supportare la scrittura di test unitari?",
      options: [
        "Eseguendo i test sui server remoti in tempo reale.",
        "Generando rapidamente casi di test e coprendo diversi scenari (casi limite, input non validi) basandosi sul codice fornito.",
        "Sostituendo completamente la necessità di eseguire la build."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! Puoi dare in pasto una funzione all'AI e chiederle di scrivere test per verificare input corretti ed errati, risparmiando molto tempo.",
        wrong: "No. Aiuta a scrivere boilerplate e combinazioni di test, velocizzando la copertura dei casi limite del codice."
      }
    },
    {
      q: "Qual è l'attitudine migliore per uno sviluppatore moderno nei confronti dell'AI?",
      options: [
        "Ignorarla considerandola una moda passeggera senza utilità pratica.",
        "Sfruttarla come acceleratore di produttività e apprendimento, rimanendo sempre il responsabile finale della qualità e della logica del codice.",
        "Delegare ogni decisione progettuale per programmare senza studiare."
      ],
      correct: 1,
      feedback: {
        correct: "Esatto! L'AI è uno strumento di amplificazione delle proprie capacità. Più sei competente come sviluppatore, più saprai usarla con profitto.",
        wrong: "No. Consiste nell'utilizzarla attivamente come moltiplicatore di efficienza senza rinunciare allo studio critico ed al controllo logico."
      }
    }
  ]
};
