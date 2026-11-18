# Digital marketing — immagini didattiche

Quattro esempi originali, in italiano e inglese, ciascuno con composizione desktop e mobile:

- `research-notes`: appunti compilati, episodio recente, alternativa e conseguenza.
- `offer`: confronto tra una proposta generica e una verificabile.
- `activation`: registro degli eventi che distingue iscrizione e primo risultato utile.
- `channels`: report di canali con visite, account, attivazioni, clienti e spesa.

Sono schermate costruite in HTML e acquisite con Chromium; nessuna illustrazione generativa.
Dati, eventi, offerte e conversazioni sono simulati e dichiarati come esempi nelle immagini.
Le quattro sequenze della guida sono ora HTML responsive con testo selezionabile e dimensioni in rem.

Rigenerazione: `node scripts/render-indie-marketing-images.mjs`.
Il renderer usa Chromium di Playwright se presente, altrimenti il Chrome locale (`CHROME_PATH` opzionale).
Le immagini hanno densità 2× e non sono ingrandite oltre la larghezza di progetto (760 o 320 CSS px).
`image-dimensions.json` conserva le dimensioni di layout per gli attributi intrinseci di img/source.
