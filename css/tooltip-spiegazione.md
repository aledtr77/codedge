<!-- HTML Esempio -->
<button class="tooltip tooltip-top">
  Passa il mouse qui
  <span class="tooltiptext">Questo è un tooltip!</span>
</button>

<button class="tooltip tooltip-bottom">
  Tooltip in basso
  <span class="tooltiptext">Appare sotto il bottone</span>
</button>

<!-- Spiegazione del Tooltip Snippet -->

<h2>Spiegazione del Tooltip Snippet</h2>

<h3>Introduzione</h3>
<p>
  Questo snippet crea un tooltip personalizzabile e responsivo utilizzando HTML, CSS e JavaScript.
  Un tooltip è un breve messaggio che appare quando l'utente passa il mouse sopra un elemento.
</p>

<h3>1. HTML</h3>
<p>
  L'HTML definisce la struttura del tooltip:
</p>
<pre>
&lt;button class="tooltip tooltip-top"&gt;
  Passa il mouse qui
  &lt;span class="tooltiptext"&gt;Questo è un tooltip!&lt;/span&gt;
&lt;/button&gt;
</pre>
<ul>
  <li><code>class="tooltip"</code>: Identifica l'elemento che avrà un tooltip.</li>
  <li><code>class="tooltip-top"</code>: Specifica la posizione del tooltip (può essere top, bottom, left, right).</li>
  <li><code>&lt;span class="tooltiptext"&gt;</code>: Contiene il testo del tooltip.</li>
</ul>

<h3>2. CSS</h3>
<p>
  Il CSS gestisce lo stile e il posizionamento del tooltip:
</p>
<ul>
  <li><code>:root { --tooltip-distance: 10px; }</code>: Definisce una variabile CSS per controllare la distanza del tooltip.</li>
  <li><code>.tooltip</code>: Imposta il posizionamento relativo per l'elemento principale.</li>
  <li><code>.tooltip .tooltiptext</code>: Stila il tooltip stesso (colore, forma, posizione).</li>
  <li><code>.tooltip:hover .tooltiptext</code>: Rende visibile il tooltip al passaggio del mouse.</li>
  <li><code>.tooltip .tooltiptext::after</code>: Crea la freccia del tooltip.</li>
  <li>Le classi <code>.tooltip-top</code>, <code>.tooltip-bottom</code>, ecc.: Gestiscono il posizionamento del tooltip.</li>
</ul>

<h3>3. JavaScript</h3>
<p>
  Il JavaScript aggiunge funzionalità dinamiche al tooltip:
</p>
<pre>
function showTooltip(element, message, duration = 2000) {
  // ... (codice della funzione)
}
</pre>
<ul>
  <li>Crea dinamicamente un tooltip se non esiste.</li>
  <li>Imposta il messaggio del tooltip.</li>
  <li>Mostra il tooltip per una durata specificata.</li>
  <li>Nasconde automaticamente il tooltip dopo la durata impostata.</li>
</ul>

<h3>Come Usare</h3>
<ol>
  <li>Aggiungi la classe <code>tooltip</code> all'elemento che deve avere un tooltip.</li>
  <li>Aggiungi una classe di posizionamento (es. <code>tooltip-top</code>).</li>
  <li>Inserisci un <code>&lt;span class="tooltiptext"&gt;</code> all'interno dell'elemento con il testo del tooltip.</li>
  <li>Per tooltip dinamici, usa la funzione JavaScript: <code>showTooltip(element, "Messaggio", 3000);</code></li>
</ol>

<h3>Personalizzazione</h3>
<p>
  Puoi personalizzare l'aspetto e il comportamento dei tooltip:
</p>
<ul>
  <li>Modifica <code>--tooltip-distance</code> nel CSS per cambiare la distanza del tooltip.</li>
  <li>Aggiungi stili CSS personalizzati per cambiare colori, dimensioni, ecc.</li>
  <li>Modifica la durata nella funzione JavaScript per tooltip che durano più o meno a lungo.</li>
</ul>

<h3>Conclusione</h3>
<p>
  Questo snippet offre un modo flessibile e facile da usare per aggiungere tooltip a qualsiasi elemento HTML,
  migliorando l'interattività e l'usabilità del tuo sito web.
</p>