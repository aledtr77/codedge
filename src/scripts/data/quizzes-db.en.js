// English question bank for the tutorial quizzes — the twin of quizzes-db.js.
// The keys are the Italian tutorial slugs on purpose: they come from the
// data-quiz-id attribute, which stays identical across both language trees so
// a quiz keeps working when a page is translated.
//
// HTML entities (&lt; &gt;) are mandatory in every string: raw < > would be
// parsed as real tags and break the quiz UI.

export const quizzesData = {
  "npm-vite-struttura-progetto": [
    {
      q: "What is NPM (Node Package Manager)?",
      options: [
        "A search engine for programmers.",
        "The default package manager for Node.js, used to install, share and manage a project's dependencies.",
        "A CSS framework, an alternative to Tailwind."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It works like an app store of libraries for JavaScript developers, letting you pull in external packages easily.",
        wrong: "No. It is the command-line tool for downloading, installing and updating packages and dependencies in your code."
      }
    },
    {
      q: "What is the 'package.json' file for in a project?",
      options: [
        "Holding the application's source code.",
        "Defining the project's metadata, its startup scripts and the list of required dependencies.",
        "Storing registered users' data."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It is the project's ID card. Without it, NPM doesn't know which dependencies to download or which scripts to run.",
        wrong: "No. It holds the configuration details, the required packages and the build/development commands (scripts)."
      }
    },
    {
      q: "What does running 'npm install' in a folder with a 'package.json' do?",
      options: [
        "Creates a backup of the local database.",
        "Downloads and installs every dependency listed in package.json into the node_modules folder.",
        "Starts the production server on AWS."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It reads the entries in package.json and downloads the actual package files the application needs to run.",
        wrong: "No. It downloads and organizes the code packages the project requires into the local install folder."
      }
    },
    {
      q: "What is the 'node_modules' folder?",
      options: [
        "The folder where optimized images for the site are saved.",
        "The directory where NPM physically installs all of the project's code packages and their sub-dependencies.",
        "The database holding the HTML files ready for publishing."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It is the folder holding all the JavaScript downloaded from the internet that your project's libraries need. It can get very large.",
        wrong: "No. It hosts the source code of every external package and module installed by NPM."
      }
    },
    {
      q: "Why should the 'node_modules' folder NEVER be pushed to Git/GitHub?",
      options: [
        "Because it contains secret files with payment details.",
        "Because it is enormous and can be regenerated at any moment by simply running 'npm install'.",
        "Because Git doesn't support files written in JavaScript."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! Committing it slows Git down and clogs the repository. Anyone who downloads your project can recreate it by running `npm install` on their own machine.",
        wrong: "No. It is always excluded via `.gitignore` to avoid uploading gigabytes of dependencies that a single command can fetch again."
      }
    },
    {
      q: "What is the 'package-lock.json' file for?",
      options: [
        "Password-protecting access to package.json.",
        "Recording the exact versions of every installed dependency, so the project builds identically on every machine.",
        "Hiding vulnerable dependencies."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It locks the sub-dependencies down, so a developer who downloads the project months later gets the same versions and avoids crashes.",
        wrong: "No. It ensures the installed dependency tree stays identical for everyone on the team."
      }
    },
    {
      q: "What is Vite.js?",
      options: [
        "A lightweight relational SQL database.",
        "A modern, extremely fast build tool used for developing and compiling web applications.",
        "A free cloud hosting service."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! Vite handles local development by serving files instantly, and compiles and minifies assets for production.",
        wrong: "No. It is the modern bundler and dev server that replaces older tools like Webpack."
      }
    },
    {
      q: "What is the difference between 'devDependencies' and 'dependencies' in package.json?",
      options: [
        "devDependencies are only needed during development and build (Vite, compilers); dependencies are also needed for the app to run online.",
        "dependencies holds CSS files, devDependencies holds JS files.",
        "There is no difference — the split is purely cosmetic."
      ],
      correct: 0,
      feedback: {
        correct: "Exactly! Tools like Vite, linters or test compilers serve the developer only and don't belong in the final production code.",
        wrong: "No. The former are developer utilities; the latter are packages the application genuinely needs at runtime."
      }
    },
    {
      q: "What does 'npm run dev' do in a Vite project?",
      options: [
        "Compiles the production bundle ready for hosting.",
        "Starts an ultra-fast local development server with Hot Module Replacement (instant refresh on save).",
        "Runs a security scan over the project's files."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It starts the local server so you can see your changes in the browser in real time as you write code.",
        wrong: "No. It starts the interactive local environment for fast development."
      }
    },
    {
      q: "What does the 'npm run build' command do?",
      options: [
        "Installs new extensions in VS Code.",
        "Compiles, optimizes, minifies and moves the source files into a distribution folder (usually 'dist/') ready for publishing.",
        "Initializes a new local Git repository."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It turns your raw source files into compressed, high-performance files ready to be published to your hosting server.",
        wrong: "No. It creates the final optimized version of the site's files (compilation/bundling) for production."
      }
    }
  ],

  "browser-devtools": [
    {
      q: "How do you usually open the Developer Tools (DevTools) in most browsers?",
      options: [
        "By pressing F12, or right-clicking and choosing 'Inspect'.",
        "By holding down the space bar for 5 seconds.",
        "By restarting the browser in safe mode."
      ],
      correct: 0,
      feedback: {
        correct: "Exactly! F12 or right-click → Inspect are the universal ways to bring up the console and the element inspector.",
        wrong: "No. You open them with the F12 shortcut or through the right-click context menu."
      }
    },
    {
      q: "What is the 'Elements' panel in DevTools mainly for?",
      options: [
        "Viewing the list of cookies saved by the site.",
        "Exploring and editing the DOM structure (HTML) and the applied CSS rules in real time.",
        "Testing your connection's download speed."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It lets you analyze the live HTML structure and see precisely which stylesheets are affecting every tag.",
        wrong: "No. It is for visually inspecting the HTML tree (the DOM) and editing CSS on the fly."
      }
    },
    {
      q: "What happens when you edit some text or a CSS rule in the Elements panel?",
      options: [
        "The change is saved permanently to the source code on your computer.",
        "The change is temporary and only visible in your browser; it disappears when you reload the page.",
        "The change is published online for every user."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It is a throwaway sandbox. Reloading the page (F5) returns everything to the state defined by the real source code.",
        wrong: "No. The changes are local and temporary — handy for quick visual experiments before touching the real code."
      }
    },
    {
      q: "What is the 'Console' for in DevTools?",
      options: [
        "Playing the site's audio files.",
        "Showing JavaScript errors and browser warnings, and letting you run JS code on the fly.",
        "Configuring the proxy server."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It is the command-line interface for talking to JavaScript and catching rendering or logic errors.",
        wrong: "No. It shows the logs and error messages from your JavaScript, and lets you test scripts in real time."
      }
    },
    {
      q: "In the Network panel, what do the individual rows represent?",
      options: [
        "The extensions installed in your browser.",
        "Every HTTP request the page makes to load resources (HTML, CSS, JS, images, APIs) along with their timings.",
        "The devices connected to your home Wi-Fi."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It shows you what is slowing the site down and whether there are broken images or missing resources (404 errors).",
        wrong: "No. It records and summarizes every single network call the browser makes to load the site."
      }
    },
    {
      q: "What is the 'Device Emulation' feature (the phone/tablet icon) for?",
      options: [
        "Making phone calls from your computer.",
        "Testing how responsive the page is by simulating different screen resolutions and touch behaviour.",
        "Downloading the site's mobile app."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It simulates popular phone screens (iPhone, Pixel and so on) so you can fix mobile layout bugs without picking up a phone.",
        wrong: "No. It resizes the browser's rendering area so you can test how well the layout adapts."
      }
    },
    {
      q: "In the Elements panel, what does a CSS rule with a line through it mean?",
      options: [
        "The rule was written badly and has a syntax error.",
        "The rule has been overridden by another rule with higher specificity or later position in the cascade.",
        "The rule is slowing the browser down."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It means the rule has been beaten — by a more specific class, say, or by rules written further down the stylesheet.",
        wrong: "No. It means the CSS cascade gave priority to a competing rule, switching this one off."
      }
    },
    {
      q: "What is the 'Application' panel for?",
      options: [
        "Downloading new programs onto your computer.",
        "Inspecting locally stored resources such as LocalStorage, SessionStorage, cookies and service workers.",
        "Configuring the source code."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It is the browser's data warehouse. It lets you view stored preferences or clear a PWA's cache.",
        wrong: "No. It is for inspecting and clearing the web page's local databases and storage systems."
      }
    },
    {
      q: "What does the 'Lighthouse' tab built into Chrome DevTools do?",
      options: [
        "Generates automatic reports on the analyzed page's performance, accessibility, best practices and SEO.",
        "Blocks the site's adverts.",
        "Finds broken links pointing to other sites."
      ],
      correct: 0,
      feedback: {
        correct: "Exactly! It measures loading speed, SEO and a11y compatibility, and suggests precise fixes for optimizing the page.",
        wrong: "No. It is the official tool for running performance and optimization audits on a page."
      }
    },
    {
      q: "In the Sources panel, what is a 'breakpoint' for?",
      options: [
        "Cutting off the page's network connection.",
        "Pausing JavaScript execution on a specific line so you can inspect the state of your variables.",
        "Defining the responsive breakpoints in your CSS."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It freezes running JavaScript on that line, letting you inspect variables step by step without resorting to console.log.",
        wrong: "No. It temporarily halts the logical flow of your scripts so you can analyze bugs and how variables behave."
      }
    }
  ]
};
