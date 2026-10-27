// Small examples: the visible CSS contains every rule that explains the result.
export function cssExperiments(lang) {
  const L = (it, en) => lang === 'it' ? it : en;
  const option = (value, label, detail) => ({ value, label, detail });
  const choice = (name, label, value, options) => ({ name, label, value, options });
  const reading = (label, value) => ({ label, value });
  const width = (doc, selector) => Math.round(doc.querySelector(selector).getBoundingClientRect().width);
  const colors = [option('#8bc9ef', L('Azzurro', 'Blue'), '#8bc9ef'), option('#efb38b', L('Arancione', 'Orange'), '#efb38b')];
  const items = '<div class="container">\n  <div>A</div>\n  <div>B</div>\n  <div>C</div>\n</div>';
  return {
    rule: {
      scene: L('Un paragrafo, una proprietà', 'One paragraph, one property'),
      height: 100,
      controls: [choice('color', 'color', '#8bc9ef', colors)],
      render: (s) => ({
        html: `<p>${L('Questo è un paragrafo.', 'This is a paragraph.')}</p>`,
        css: `p {\n  color: ${s.color};\n}`,
        activeLines: [1],
        note: L(`Il selettore p trova il paragrafo. La proprietà color assegna ${s.color} al testo.`, `The p selector matches the paragraph. The color property assigns ${s.color} to the text.`),
      }),
      inspect: (doc) => [reading(L('Colore calcolato', 'Computed color'), doc.defaultView.getComputedStyle(doc.querySelector('p')).color)],
    },
    selectors: {
      scene: L('Tre paragrafi: A, B e C', 'Three paragraphs: A, B and C'),
      height: 130,
      controls: [choice('selector', L('Elementi selezionati', 'Matched elements'), 'p', [
        option('p', 'p', 'A, B, C'), option('.group p', '.group p', 'A, B'), option('.group > p', '.group > p', 'A'),
      ])],
      render: (s) => ({
        html: '<div class="group">\n  <p class="note" id="intro">A</p>\n  <section>\n    <p class="note">B</p>\n  </section>\n</div>\n<p>C</p>',
        css: `${s.selector} {\n  color: #8bc9ef;\n}`,
        note: ({
          p: L('p seleziona tutti e tre i paragrafi. A, B e C sono azzurri.', 'p matches all three paragraphs. A, B and C are blue.'),
          '.group p': L('Lo spazio seleziona i paragrafi dentro .group anche se annidati: A e B. C è fuori da .group.', 'The space matches paragraphs inside .group, including nested ones: A and B. C is outside .group.'),
          '.group > p': L('> seleziona solo i paragrafi figli diretti di .group: A. Il genitore immediato di B è section, quindi B resta escluso.', '> only matches paragraphs that are direct children of .group: A. B’s immediate parent is section, so B is excluded.'),
        })[s.selector],
      }),
      inspect: (doc, s) => [reading(L('Paragrafi selezionati', 'Matched paragraphs'), [...doc.querySelectorAll(s.selector)].map((el) => el.textContent).join(', '))],
    },
    cascade: {
      scene: L('Due regole sullo stesso paragrafo', 'Two rules on the same paragraph'),
      height: 100,
      controls: [choice('case', L('Criterio che decide il colore', 'What decides the color'), 'specificity', [
        option('specificity', L('Specificità', 'Specificity'), L('.note prima, p dopo', '.note first, p last')),
        option('order', L('Parità: ultima azzurra', 'Tie: blue last'), L('Due regole .note', 'Two .note rules')),
        option('reverse', L('Parità: ultima arancione', 'Tie: orange last'), L('Stesse regole, ordine inverso', 'Same rules, reversed order')),
      ])],
      render: (s) => {
        const orange = '.note { color: #efb38b; }';
        const blue = `${s.case === 'specificity' ? 'p' : '.note'} { color: #8bc9ef; }`;
        return {
          html: '<p class="note">A</p>',
          css: s.case === 'reverse' ? `${blue}\n${orange}` : `${orange}\n${blue}`,
          dimLines: [s.case === 'specificity' ? 1 : 0],
          note: s.case === 'specificity'
            ? L('A è arancione: .note ha specificità (0,1,0), p ha (0,0,1). La classe prevale anche se è scritta prima.', 'A is orange: .note has specificity (0,1,0), p has (0,0,1). The class wins even though it is written first.')
            : L(`Entrambi i selettori sono .note: stessa specificità. Prevale l’ultima dichiarazione, quindi A è ${s.case === 'order' ? 'azzurro' : 'arancione'}.`, `Both selectors are .note: equal specificity. The last declaration wins, so A is ${s.case === 'order' ? 'blue' : 'orange'}.`),
        };
      },
    },
    inheritance: {
      scene: L('Un genitore e un paragrafo figlio', 'A parent and a child paragraph'),
      height: 130,
      controls: [choice('own', L('Colore del paragrafo', 'Paragraph color'), 'inherit', [
        option('inherit', L('Nessuna regola propria', 'No rule of its own'), L('Eredita arancione', 'Inherits orange')),
        option('blue', 'p { color: #8bc9ef; }', L('Valore assegnato al figlio', 'Value assigned to the child')),
      ])],
      render: (s) => ({
        html: `<div class="parent">\n  ${L('Genitore', 'Parent')}\n  <p>${L('Paragrafo figlio', 'Child paragraph')}</p>\n</div>`,
        css: `.parent {\n  color: #efb38b;\n  border: 2px solid #efb38b;\n  padding: 12px;\n}${s.own === 'blue' ? '\np { color: #8bc9ef; }' : ''}`,
        note: s.own === 'blue'
          ? L('Il figlio usa il proprio color, quindi è azzurro. Il genitore resta arancione. Il bordo appartiene solo al genitore.', 'The child uses its own color, so it is blue. The parent stays orange. The border belongs only to the parent.')
          : L('Il figlio eredita color dal genitore: entrambi i testi sono arancioni. Non eredita border né padding: il paragrafo non aggiunge una seconda cornice.', 'The child inherits color from its parent: both texts are orange. It does not inherit border or padding: the paragraph adds no second frame.'),
      }),
      inspect: (doc) => [reading(L('Bordo del figlio', 'Child border'), doc.defaultView.getComputedStyle(doc.querySelector('p')).borderTopWidth)],
    },
    flow: {
      scene: L('Due span con width: 80px', 'Two spans with width: 80px'),
      height: 130,
      controls: [choice('display', 'display', 'inline', ['inline', 'block', 'inline-block', 'none'].map((value) => option(value, value)))],
      render: (s) => ({
        html: '<span class="item">A</span>\n<span class="item">B</span>',
        css: `.item {\n  display: ${s.display};\n  width: 80px;\n  background-color: #254761;\n}`,
        activeLines: [1],
        note: ({
          inline: L('Gli span partecipano alla riga di testo. width non imposta la loro larghezza: ogni sfondo segue il contenuto.', 'The spans participate in the text line. width does not set their width: each background follows its content.'),
          block: L('Ogni span inizia una nuova riga e misura 80px. Il CSS ha cambiato il comportamento iniziale degli span.', 'Each span starts a new line and measures 80px. CSS changed the spans’ initial behavior.'),
          'inline-block': L('Ogni span misura 80px e partecipa alla stessa riga, se lo spazio basta. Su una riga stretta il secondo va a capo.', 'Each span measures 80px and participates in the same line if there is room. On a narrow line the second wraps.'),
          none: L('Gli span non generano scatole: non sono visibili e non occupano spazio. Restano presenti nell’HTML.', 'The spans generate no boxes: they are invisible and take no space. They remain in the HTML.'),
        })[s.display],
      }),
      inspect: (doc) => [reading(L('Larghezza di A', 'Width of A'), `${width(doc, '.item')}px`)],
    },
    box: {
      scene: L('Una scatola con misure note', 'A box with known dimensions'),
      height: 150,
      minWidth: 240,
      controls: [choice('sizing', 'box-sizing', 'content-box', [option('content-box', 'content-box', L('Bordo esterno: 144px', 'Border box: 144px')), option('border-box', 'border-box', L('Bordo esterno: 120px', 'Border box: 120px'))])],
      render: (s) => ({
        html: '<div class="box">A</div>',
        css: `.box {\n  box-sizing: ${s.sizing};\n  width: 120px;\n  padding: 10px;\n  border: 2px solid #8bc9ef;\n  margin: 16px;\n}`,
        activeLines: [1],
        note: s.sizing === 'content-box'
          ? L('width assegna 120px al contenuto. Aggiungi 20px di padding e 4px di bordo: la scatola misura 144px fino al bordo esterno. Il margine resta fuori.', 'width assigns 120px to the content. Add 20px of padding and 4px of border: the border box measures 144px. Margin stays outside.')
          : L('width assegna 120px a contenuto, padding e bordo insieme. Sottraendo 20px di padding e 4px di bordo restano 96px di contenuto. Il margine resta fuori.', 'width assigns 120px to content, padding and border together. Subtracting 20px of padding and 4px of border leaves 96px of content. Margin stays outside.'),
      }),
      inspect: (doc) => {
        const box = doc.querySelector('.box');
        const css = doc.defaultView.getComputedStyle(box);
        return [reading(L('Larghezza fino al bordo', 'Border-box width'), `${width(doc, '.box')}px`), reading(L('Larghezza del contenuto', 'Content width'), `${box.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight)}px`)];
      },
    },
    units: {
      scene: L('Figlio al 50% del genitore', 'Child at 50% of parent'),
      height: 130,
      minWidth: 280,
      controls: [choice('width', L('width del genitore', 'Parent width'), '160', [option('160', '160px', L('Figlio: 80px', 'Child: 80px')), option('240', '240px', L('Figlio: 120px', 'Child: 120px'))])],
      render: (s) => ({
        html: '<div class="parent">\n  <div class="child">50%</div>\n</div>',
        css: `.parent {\n  width: ${s.width}px;\n  background-color: #263448;\n}\n.child {\n  width: 50%;\n  background-color: #386286;\n}`,
        activeLines: [1],
        note: L(`Il genitore misura ${s.width}px. Il figlio misura la metà: ${Number(s.width) / 2}px. Il 50% si riferisce al contenitore, non alla finestra del browser.`, `The parent measures ${s.width}px. The child measures half: ${Number(s.width) / 2}px. The 50% refers to the container, not the browser window.`),
      }),
      inspect: (doc) => [reading(L('Genitore', 'Parent'), `${width(doc, '.parent')}px`), reading(L('Figlio', 'Child'), `${width(doc, '.child')}px`)],
    },
    states: {
      scene: L('Un campo di testo con :focus', 'A text field with :focus'),
      height: 130,
      controls: [],
      render: () => ({
        html: `<label for="name">${L('Nome', 'Name')}</label>\n<input id="name" type="text">`,
        css: 'input {\n  width: 100%;\n  border: 1px solid #acbdd2;\n}\ninput:focus {\n  outline: 3px solid #8bc9ef;\n  outline-offset: 2px;\n}',
        note: L('input:focus si applica solo mentre il campo ha focus. Il browser aggiorna lo stato dopo un clic o un comando da tastiera; non serve JavaScript per questa regola CSS.', 'input:focus applies only while the field has focus. The browser updates this state after a click or keyboard action; this CSS rule needs no JavaScript.'),
      }),
    },
    flex: {
      scene: L('Tre figli diretti di un contenitore flex', 'Three direct children of a flex container'),
      height: 190,
      controls: [choice('direction', 'flex-direction', 'row', [option('row', 'row', L('Asse principale orizzontale', 'Horizontal main axis')), option('column', 'column', L('Asse principale verticale', 'Vertical main axis'))])],
      render: (s) => ({
        html: items,
        css: `.container {\n  display: flex;\n  flex-direction: ${s.direction};\n  gap: 12px;\n}\n.container > div {\n  background-color: #254761;\n}`,
        activeLines: [2],
        note: s.direction === 'row'
          ? L('A, B e C sono in riga. L’asse principale è orizzontale; il gap di 12px separa i figli lungo la riga.', 'A, B and C form a row. The main axis is horizontal; the 12px gap separates the children along the row.')
          : L('A, B e C sono in colonna. L’asse principale è verticale; lo stesso gap di 12px ora separa i figli in verticale.', 'A, B and C form a column. The main axis is vertical; the same 12px gap now separates the children vertically.'),
      }),
    },
    grid: {
      scene: L('Quattro figli in una griglia', 'Four children in a grid'),
      height: 210,
      controls: [choice('columns', 'grid-template-columns', '2', [option('1', '1fr', L('Una colonna, quattro righe', 'One column, four rows')), option('2', '1fr 1fr', L('Due colonne, due righe', 'Two columns, two rows'))])],
      render: (s) => ({
        html: items.replace('\n</div>', '\n  <div>D</div>\n</div>'),
        css: `.container {\n  display: grid;\n  grid-template-columns: ${s.columns === '1' ? '1fr' : '1fr 1fr'};\n  gap: 12px;\n}\n.container > div {\n  background-color: #254761;\n}`,
        activeLines: [2],
        note: s.columns === '1'
          ? L('Una traccia di colonna: A, B, C e D vengono disposti in quattro righe. La colonna usa lo spazio disponibile.', 'One column track: A, B, C and D are placed in four rows. The column uses the available space.')
          : L('Due tracce uguali: A e B occupano la prima riga, C e D la seconda. Le colonne condividono la larghezza rimasta dopo il gap di 12px.', 'Two equal tracks: A and B occupy the first row, C and D the second. The columns share the width remaining after the 12px gap.'),
      }),
      inspect: (doc) => [reading(L('Colonne calcolate', 'Computed columns'), doc.defaultView.getComputedStyle(doc.querySelector('.container')).gridTemplateColumns)],
    },
    position: {
      scene: L('Un genitore e due figli: A e B', 'A parent and two children: A and B'),
      height: 210,
      controls: [choice('position', L('position del figlio A', 'Position of child A'), 'static', [option('static', 'static', L('A occupa spazio nel flusso', 'A takes space in flow')), option('absolute', 'absolute', L('A esce dal flusso', 'A leaves flow'))])],
      render: (s) => ({
        html: '<div class="parent">\n  <div class="a">A</div>\n  <div class="b">B</div>\n</div>',
        css: `.parent {\n  position: relative;\n  min-height: 140px;\n  border: 1px solid #acbdd2;\n}\n.a {\n  position: ${s.position};\n  top: 12px;\n  right: 12px;\n  background-color: #386286;\n}`,
        activeLines: [6],
        note: s.position === 'static'
          ? L('A e B restano nel flusso: B inizia sotto A. top e right non agiscono su A perché position è static.', 'A and B remain in flow: B starts below A. top and right have no effect on A because its position is static.')
          : L('A non occupa più spazio nel flusso e B risale. top e right posizionano A a 12px dal riferimento del genitore relative. Il contenitore resta alto almeno 140px per la sua min-height.', 'A no longer takes space in flow and B moves up. top and right position A 12px from the relative parent’s reference. The container remains at least 140px tall because of its min-height.'),
      }),
      inspect: (doc) => [reading(L('Bordo superiore di B nel genitore', 'B top edge within parent'), `${Math.round(doc.querySelector('.b').getBoundingClientRect().top - doc.querySelector('.parent').getBoundingClientRect().top)}px`)],
    },
    responsive: {
      scene: L('La media query usa questa finestra', 'The media query uses this viewport'),
      height: 210,
      controls: [choice('width', L('Larghezza del viewport dell’esempio', 'Example viewport width'), '639', [option('639', '639px', L('Condizione falsa: una colonna', 'Condition false: one column')), option('640', '640px', L('Condizione vera: due colonne', 'Condition true: two columns'))])],
      render: () => ({
        html: items.replace('\n</div>', '\n  <div>D</div>\n</div>'),
        css: '.container {\n  display: grid;\n  grid-template-columns: 1fr;\n  gap: 12px;\n}\n.container > div { background-color: #254761; }\n@media (min-width: 640px) {\n  .container { grid-template-columns: 1fr 1fr; }\n}',
        note: L('A 639px si applica la base: una colonna. A 640px si applica anche la media query: due colonne. display e gap restano attivi in entrambi i casi.', 'At 639px the baseline applies: one column. At 640px the media query also applies: two columns. display and gap remain active in both cases.'),
      }),
      inspect: (doc) => [reading('Viewport', `${doc.defaultView.innerWidth}px`), reading('min-width: 640px', doc.defaultView.matchMedia('(min-width: 640px)').matches ? L('vera', 'true') : L('falsa', 'false'))],
    },
    variables: {
      scene: L('Una variabile, due paragrafi', 'One variable, two paragraphs'),
      height: 110,
      controls: [choice('color', '--accent', '#8bc9ef', colors)],
      render: (s) => ({
        html: '<p class="a">A</p>\n<p class="b">B</p>',
        css: `:root { --accent: ${s.color}; }\n.a { color: var(--accent); }\n.b { color: var(--accent); }`,
        activeLines: [0],
        note: L(`--accent vale ${s.color}. Entrambi i paragrafi usano var(--accent), quindi ricevono lo stesso colore. Hai modificato una sola dichiarazione.`, `--accent is ${s.color}. Both paragraphs use var(--accent), so they receive the same color. You changed one declaration.`),
      }),
    },
  };
}
