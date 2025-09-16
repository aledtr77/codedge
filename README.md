```markdown
#  CODEDGE

![Pages CI](https://github.com/aledtr77/codedge/actions/workflows/pages-deploy.yml/badge.svg)

**Sito personale / learning lab per Front-end (HTML, CSS, JavaScript).**  
Esercizi e progetti pratici costruiti con **Vite**, automatizzati e deployati su **GitHub Pages** (Actions → artifact).  
Dominio custom: **codedge.it**

---

## 📌 Indice
- [Stato del progetto](#stato-del-progetto)  
- [Tech stack & dipendenze](#tech-stack--dipendenze)  
- [Struttura del progetto](#struttura-del-progetto)  
- [Requisiti (locale)](#requisiti-locale)  
- [Installazione & sviluppo locale](#installazione--sviluppo-locale)  
- [Script utili](#script-utili)  
- [Build & preview](#build--preview)  
- [Deploy (automazione)](#deploy-automazione)  
- [Troubleshooting rapido](#troubleshooting-rapido)  
- [Contribuire](#contribuire)  
- [Licenza & contatti](#licenza--contatti)

---

## Stato del progetto
Il sito viene costruito con **Vite** e pubblicato automaticamente tramite **GitHub Actions → Pages (artifact)**.  
La pubblicazione è gestita dal workflow (`build_type: workflow`). La branch `gh-pages` è stata rimossa come residuo della vecchia procedura.

> ⚠️ Nota: potresti vedere riferimenti residui a `gh-pages` nelle API/UI di GitHub per qualche minuto; il valore che conta è `build_type: "workflow"`.

---

## Tech stack & dipendenze
- **Runtime**: Node.js (consigliato **v20**)  
- **Tooling**: Vite  
- Dipendenze principali (esempi): `@emailjs/browser`, `@fortawesome/fontawesome-free`, `@jaames/iro`, `compressorjs`, `prismjs`.  
- DevDependencies importanti: `vite`, `html-minifier-terser`  

Per la lista completa: vedi `package.json`.

---

## Struttura del progetto
```

/
├─ .github/workflows/      # workflow (build & deploy)
├─ public/                 # file statici copiati in dist/
├─ site-pages/             # sorgenti HTML delle pagine (ENTRY\_DIR)
├─ src/                    # sorgenti JS/CSS
├─ dist/                   # build output (generato)
├─ package.json
├─ package-lock.json
├─ vite.config.js
├─ CNAME                   # domain: codedge.it
└─ README.md

```

**Nota**: il progetto usa `site-pages/` come sorgente delle pagine HTML. In dev Vite riscrive le richieste "pulite" (es. `/risorse/`) verso `site-pages/`; in build i file generati in `dist/site-pages/*` vengono spostati in `dist/*` e gli href vengono riscritti. Questo comportamento è implementato in `vite.config.js`.

---

## Requisiti (locale)
- Node.js 20.x (consigliato)  
- npm

---

## Installazione & sviluppo locale

```bash
# clona il repo (se non l'hai già fatto)
git clone git@github.com:aledtr77/codedge.git
cd codedge

# installa dipendenze (pulito)
npm ci

# avvia in sviluppo (hot reload)
npm run dev
````

> Lo script `dev` esegue prima `gen:breadcrumbs` e poi avvia Vite in dev mode (vedi `package.json`).

---

## Script utili (dal package.json)

* `gen:breadcrumbs` → `node scripts/generate-breadcrumbs.js`
* `dev` → `npm run gen:breadcrumbs && vite`
* `prebuild` → `npm run gen:breadcrumbs`
* `build` → `vite build`
* `preview` → `vite preview --port 5000`

Usali così:

```bash
# sviluppo
npm run dev

# build produzione
npm run build

# preview della build
npm run preview
```

---

## Build & preview

* `npm run build` genera `dist/`.
* `npm run preview` serve la build localmente (porta 5000 di default).

> `prebuild` viene eseguito automaticamente prima di `build` per aggiornare i breadcrumbs.

---

## Deploy (automazione)

Il deploy è completamente automatico: al push su `main` il workflow GitHub Actions esegue:

1. `npm ci`
2. `npm run build`
3. copia del file `CNAME` (se presente) in `dist/` e creazione di `404.html` da `index.html` (utile per SPA)
4. upload del contenuto `dist/` come artifact e deploy tramite `actions/deploy-pages`

Quindi **non** è necessario pushare manualmente `dist/` su una branch separata.

---

## 🔧 Troubleshooting rapido

* **Action fallita** → Controlla i log in **Actions** (errori comuni: dipendenze non compatibili o action deprecate).
* **404 su asset** → Verifica che i plugin in `vite.config.js` spostino `site-pages/*` correttamente e che il file `CNAME` sia stato copiato.
* **Problemi DNS per codedge.it** → Controlla i record DNS sul provider (Netsons) e che `CNAME` contenga esattamente `codedge.it`.
* Per testare senza cache:

  ```bash
  curl -I -H 'Cache-Control: no-cache' https://codedge.it
  ```

---

## Contribuire

Questo è un laboratorio personale, ma PR e suggerimenti sono benvenuti:

1. Fork → crea una branch feature
2. Lavora e testa localmente (`npm ci && npm run build`)
3. Apri PR verso `main`, con descrizione chiara

---


## Contatti

Ale — `aledtr77` su GitHub.
Apri issue o PR per segnalare bug o proporre miglioramenti.



