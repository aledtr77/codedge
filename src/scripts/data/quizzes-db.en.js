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
  ],
  "css-fondamentali": [
    {
      "q": "In <code>p { color: blue; }</code>, which part is the selector?",
      "options": [
        "<code>color</code>",
        "<code>p</code>",
        "<code>blue</code>"
      ],
      "correct": 1,
      "feedback": {
        "correct": "<code>p</code> selects paragraphs. <code>color</code> is the property; <code>blue</code> is its value.",
        "wrong": "<code>p</code> selects paragraphs. <code>color</code> is the property; <code>blue</code> is its value."
      }
    },
    {
      "q": "Paragraph B is inside a section, which is inside .group. Which selector reaches B?",
      "options": [
        "<code>.group &gt; p</code>",
        "<code>.group p</code>",
        "<code>p.group</code>"
      ],
      "correct": 1,
      "feedback": {
        "correct": "A space reaches descendants at any depth. > requires a direct child; p.group requires the group class on the paragraph.",
        "wrong": "A space reaches descendants at any depth. > requires a direct child; p.group requires the group class on the paragraph."
      }
    },
    {
      "q": "In the same stylesheet, without !important or layers: <code>.note { color: orange; }</code> comes before <code>p { color: blue; }</code>. A p with class note is…",
      "options": [
        "blue, because p is written later.",
        "orange, because .note is more specific.",
        "without a color, because the rules cancel out."
      ],
      "correct": 1,
      "feedback": {
        "correct": "The class has specificity (0,1,0); the p type has (0,0,1). Specificity decides first; order only decides a tie.",
        "wrong": "The class has specificity (0,1,0); the p type has (0,0,1). Specificity decides first; order only decides a tie."
      }
    },
    {
      "q": "A div has color: orange and a border. Its p has no rules of its own. What does the p normally inherit?",
      "options": [
        "The color, but not the border.",
        "Both color and border.",
        "The border, but not the color."
      ],
      "correct": 0,
      "feedback": {
        "correct": "color normally inherits; border does not. The parent’s frame is not duplicated on the child.",
        "wrong": "color normally inherits; border does not. The parent’s frame is not duplicated on the child."
      }
    },
    {
      "q": "Two spans have display: block. How are they arranged in normal flow with horizontal writing?",
      "options": [
        "Always side by side.",
        "Each starts on a new line.",
        "They take no space."
      ],
      "correct": 1,
      "feedback": {
        "correct": "display: block makes each box start a new line. This behavior does not need Flexbox.",
        "wrong": "display: block makes each box start a new line. This behavior does not need Flexbox."
      }
    },
    {
      "q": "A box has width: 100px, padding: 10px, border: 2px solid and box-sizing: content-box. How wide is it to the outer border?",
      "options": [
        "100px",
        "120px",
        "124px"
      ],
      "correct": 2,
      "feedback": {
        "correct": "100 + 10 + 10 + 2 + 2 = 124px. With border-box the 100px would include padding and border. Margins remain outside.",
        "wrong": "100 + 10 + 10 + 2 + 2 = 124px. With border-box the 100px would include padding and border. Margins remain outside."
      }
    },
    {
      "q": "An element has font-size: 20px and padding: 1em. How much padding is there on each side?",
      "options": [
        "16px, always.",
        "20px, because em padding uses the element’s own font.",
        "The font size of html."
      ],
      "correct": 1,
      "feedback": {
        "correct": "For padding, em uses the element’s own font size. In font-size, em uses the parent’s font size instead. rem uses the root html font size.",
        "wrong": "For padding, em uses the element’s own font size. In font-size, em uses the parent’s font size instead. rem uses the root html font size."
      }
    },
    {
      "q": "A flex container has flex-direction: column. Which axis does justify-content affect with horizontal writing?",
      "options": [
        "Horizontal, always.",
        "Vertical, because it is the main axis here.",
        "Both at once."
      ],
      "correct": 1,
      "feedback": {
        "correct": "justify-content affects the main axis. With column, in this example, that axis is vertical; align-items affects the cross axis.",
        "wrong": "justify-content affects the main axis. With column, in this example, that axis is vertical; align-items affects the cross axis."
      }
    },
    {
      "q": "A grid has grid-template-columns: 1fr 1fr and four children without explicit placement. How are they arranged?",
      "options": [
        "Four columns.",
        "Two columns and two rows.",
        "One column and four rows."
      ],
      "correct": 1,
      "feedback": {
        "correct": "The container defines two columns. The browser places two children in the first row and two in the second, following HTML order.",
        "wrong": "The container defines two columns. The browser places two children in the first row and two in the second, following HTML order."
      }
    },
    {
      "q": "The @media (min-width: 640px) condition is true when the viewport measures…",
      "options": [
        "639px.",
        "640px and above.",
        "Only exactly 640px."
      ],
      "correct": 1,
      "feedback": {
        "correct": "min-width includes the threshold. Below 640px the group’s rules do not apply; from 640px they join the other relevant rules.",
        "wrong": "min-width includes the threshold. Below 640px the group’s rules do not apply; from 640px they join the other relevant rules."
      }
    }
  ],
  "javascript-fondamentali": [
    {
      q: "What does JavaScript do in the first experiment?",
      options: [
        "It creates the HTML button.",
        "It reacts to the click and changes the paragraph text.",
        "It sets the button colour."
      ],
      correct: 1,
      feedback: {
        correct: "The listener receives the click and textContent updates the paragraph.",
        wrong: "HTML provides the button structure; JavaScript reacts to the click and changes the text."
      }
    },
    {
      q: "Why does the project use defer on the script tag?",
      options: [
        "To run the script after HTML parsing.",
        "To save clicks in the browser.",
        "To run the script only on a click."
      ],
      correct: 0,
      feedback: {
        correct: "The HTML elements have been parsed by the time the script runs.",
        wrong: "defer controls when the script starts, not storage or events."
      }
    },
    {
      q: "What does document.querySelector(\"#result\") find?",
      options: [
        "Every paragraph on the page.",
        "The element with id=\"result\".",
        "A file named result."
      ],
      correct: 1,
      feedback: {
        correct: "The # character denotes an ID selector.",
        wrong: "querySelector searches the page; # denotes an ID."
      }
    },
    {
      q: "Which keyword fits a count that is reassigned on each click?",
      options: [
        "const",
        "let",
        "defer"
      ],
      correct: 1,
      feedback: {
        correct: "let allows a new value to be assigned to clicks.",
        wrong: "The count changes: let permits reassignment."
      }
    },
    {
      q: "What does addEventListener(\"click\", ...) do?",
      options: [
        "It registers code to run when a click occurs.",
        "It runs the code every second.",
        "It opens the Console automatically."
      ],
      correct: 0,
      feedback: {
        correct: "The browser calls the registered function when the button receives a click.",
        wrong: "A listener responds to an event; it is not a timer or a debugging tool."
      }
    },
    {
      q: "In the counter, what does clicks === 3 mean?",
      options: [
        "It increases clicks by three.",
        "It checks whether clicks is the number 3 without automatic conversion.",
        "It turns clicks into the text \"3\"."
      ],
      correct: 1,
      feedback: {
        correct: "=== compares values without automatically converting types.",
        wrong: "=== compares; it does not assign or convert the value."
      }
    },
    {
      q: "What does return do in the messageFor function?",
      options: [
        "It gives text back to the place that called the function.",
        "It reloads the page.",
        "It resets the counter."
      ],
      correct: 0,
      feedback: {
        correct: "The function returns text that the listener uses to update the page.",
        wrong: "return gives back a value; it does not reload the page or change clicks by itself."
      }
    },
    {
      q: "Which property reads text entered in the name field?",
      options: [
        "textContent",
        "value",
        "src"
      ],
      correct: 1,
      feedback: {
        correct: "value holds the current input value.",
        wrong: "textContent reads or writes element text; src points to a file."
      }
    },
    {
      q: "Why does the project use textContent to show the name?",
      options: [
        "It interprets the name as HTML.",
        "It shows the name as text without interpreting it as HTML.",
        "It saves the name in localStorage."
      ],
      correct: 1,
      feedback: {
        correct: "textContent inserts text even if the name contains characters resembling HTML tags.",
        wrong: "textContent does not interpret markup or save data in the browser."
      }
    },
    {
      q: "Why does reset assign clicks = 0 as well as changing the visible text?",
      options: [
        "So the old count does not return on the next click.",
        "To close the browser.",
        "To delete script.js."
      ],
      correct: 0,
      feedback: {
        correct: "The variable is the state used by the next click.",
        wrong: "Changing only the visible text does not change the variable used by the first button."
      }
    },
    {
      q: "What does 3 + \"1\" produce in JavaScript?",
      options: ["4", "\"31\"", "NaN"],
      correct: 1,
      feedback: { correct: "With a string, + joins text: 3 + \"1\" produces \"31\".", wrong: "An HTML input returns text; use Number() for numerical addition." }
    },
    {
      q: "What does Number(\"three\") return?",
      options: ["3", "undefined", "NaN"],
      correct: 2,
      feedback: { correct: "Non-numeric text cannot be converted: the result is NaN.", wrong: "Number() does not interpret the word three as a number; it returns NaN." }
    },
    {
      q: "When is valid && clicks >= goal true?",
      options: ["When both parts are true.", "When either part is true.", "After every click."],
      correct: 0,
      feedback: { correct: "&& requires a valid goal that has also been reached.", wrong: "&& requires both conditions; || requires at least one." }
    },
    {
      q: "Where can you read a const text variable declared inside a function?",
      options: ["Inside that function and its inner blocks.", "In any script on the page.", "Only in HTML."],
      correct: 0,
      feedback: { correct: "A local variable remains in the scope of the block where it was declared.", wrong: "const and let have block scope: text is unavailable outside the function." }
    },
    {
      q: "What does for (const goal of goals) examine?",
      options: ["The page's CSS properties.", "One array item at a time.", "Only the first array item."],
      correct: 1,
      feedback: { correct: "for...of takes each value in the array in sequence.", wrong: "The for...of loop visits array values, one per iteration." }
    },
    {
      q: "What happens to the page while an async function awaits a Promise?",
      options: ["It stops responding until the wait ends.", "It keeps responding; the function resumes later.", "It deletes the counter variables."],
      correct: 1,
      feedback: { correct: "await pauses that function, not the whole page.", wrong: "The async function waits; the browser can still handle clicks." }
    }
  ],
  "deploy-base": [
    {
      q: "What does 'deploying' a website mean?",
      options: [
        "Writing the HTML code in your editor.",
        "The process of publishing and transferring the site's files to a web server so they are reachable on the internet.",
        "Buying a custom domain."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! Deploying means physically moving your compiled code from your computer to a public server anyone can reach.",
        wrong: "No. It is the step that releases code from your local machine to a public server online."
      }
    },
    {
      q: "What is the difference between hosting and a domain?",
      options: [
        "Hosting is the physical space on the server where the files live; the domain is the text address (e.g. codedge.it) people use to reach them.",
        "Hosting is paid yearly, a domain is always free.",
        "The domain is the database, the hosting is the JavaScript code."
      ],
      correct: 0,
      feedback: {
        correct: "Exactly! Hosting is the 'house' your files live in, the domain is the 'doorbell' — the text name mapped to the IP — that lets people knock.",
        wrong: "No. Hosting stores and serves the files; the domain is the text address that makes them easy to find."
      }
    },
    {
      q: "What is a static website?",
      options: [
        "A site with no CSS animations or transitions.",
        "A site made of finished files (HTML, CSS, JS, images) served to the user exactly as they are, with no server-side processing.",
        "A site that only opens on a computer and not on a phone."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It needs no dynamic database at runtime (unlike WordPress or PHP): the server sends the client files exactly as they are.",
        wrong: "No. It means a site with no dynamic server-side logic. The files are pre-built and ready to serve."
      }
    },
    {
      q: "Which of these platforms is a good free choice for hosting static sites?",
      options: [
        "WordPress.com",
        "GitHub Pages, Netlify or Vercel.",
        "AWS EC2 with no configuration."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! These platforms hook into GitHub and run fast, automatic builds and deployments at no cost for static projects.",
        wrong: "No. GitHub Pages, Netlify and Vercel offer excellent automated static hosting for free."
      }
    },
    {
      q: "On a web server for static sites, which file is usually looked for by default in the root?",
      options: [
        "`main.js`",
        "`index.html`",
        "`home.css`"
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! Web servers look for 'index.html' by default to load the landing page when no explicit resource is requested.",
        wrong: "No. The universal entry file servers look for is always 'index.html'."
      }
    },
    {
      q: "What is an SSL certificate (HTTPS) for?",
      options: [
        "Speeding up how fast the site's files download.",
        "Encrypting the connection between browser and server, which keeps data safe and helps how Google indexes the site.",
        "Hiding the source code from anyone inspecting the page."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It protects data in transit (passwords or form data, say) and stops Chrome from showing the red 'Not secure' warning.",
        wrong: "No. It ensures the data exchanged between user and server is encrypted, which improves both trust and SEO."
      }
    },
    {
      q: "What is DNS (the Domain Name System)?",
      options: [
        "The configuration files for browser extensions.",
        "The system that translates readable domain names (e.g. google.com) into the numeric IP addresses of the servers behind them.",
        "NPM packages used for building."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It works like the internet's phone book, turning names that are easy to remember into numeric IP coordinates.",
        wrong: "No. It translates text domains into the real server IPs they point at."
      }
    },
    {
      q: "In a modern app's deployment flow, what is the 'dist/' (or 'build/') folder for?",
      options: [
        "Holding backup copies of the unoptimised files.",
        "It holds the minified, optimised, ready-to-serve code produced by the build command, and it is the only folder to upload to the hosting.",
        "Configuring secret environment variables."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It is the distilled version of your source code. It is light, has no node_modules, and holds only what is needed online.",
        wrong: "No. It is the build's finish line: it holds the compressed, optimised files meant for publication."
      }
    },
    {
      q: "What is 'Continuous Deployment'?",
      options: [
        "Uploading files by hand through an FTP client every evening.",
        "An automated system that updates the live site every time you push new commits to the main branch on GitHub.",
        "Automatic renewal of your hosting subscription."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! You just run `git push` and the servers notice the change, rebuild and update the public site within seconds.",
        wrong: "No. It syncs and publishes online automatically from the code you push to GitHub."
      }
    },
    {
      q: "What is the risk of editing files directly on the production server (via FTP, for example)?",
      options: [
        "That your local computer suddenly shuts down.",
        "Falling out of sync with your local source code, so the next automatic deployment overwrites or loses those edits.",
        "That the user's browser refuses to open the page."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! Those edits would be wiped out by the first automatic deployment from GitHub. The real source of truth must always live in Git.",
        wrong: "No. It risks breaking alignment with the repository, so the changes are lost at the next build."
      }
    }
  ],
  "accessibilita-web-base": [
    {
      q: "What does 'web accessibility' (a11y) mean?",
      options: [
        "Making a site usable only by people with an ultra-fast internet connection.",
        "Designing websites that anyone can use, including people with physical, cognitive, sensory or temporary disabilities.",
        "Protecting the site with passwords and secure login systems."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It means removing digital barriers so that blind, partially sighted, deaf and motor-impaired users can use the site too.",
        wrong: "No. It is digital inclusion: letting anyone, whatever their limitations, get through the site successfully."
      }
    },
    {
      q: "How does semantic HTML help accessibility?",
      options: [
        "It makes the code more colourful and easier to read in VS Code.",
        "It lets screen readers understand and announce the structure of the page (navigation, article, form and so on).",
        "It speeds up how fast the browser loads."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! A screen reader knows a `<button>` performs an action, while a `<div>` with a click handler is invisible to it.",
        wrong: "No. It gives the page a logical structure that assistive devices can recognise and read aloud."
      }
    },
    {
      q: "What is the main purpose of the 'alt' attribute on image tags?",
      options: [
        "Pointing at where the image file lives on the server.",
        "Providing a text alternative for the image, which screen readers announce to blind users.",
        "Setting how big the image appears on screen."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It lets someone who cannot see the image understand what it is there for and what it means on the page.",
        wrong: "No. It is the alternative text read aloud in place of the image for people using a screen reader."
      }
    },
    {
      q: "Why does the contrast between text colour and background need to be high enough?",
      options: [
        "To make the site comply with Apple's style guidelines.",
        "To keep text readable for people with visual impairments (colour blindness, for instance) or in bright sunlight.",
        "To reduce the monitor's battery usage."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! Low contrast (light grey text on white, say) makes a site tiring for everyone to read, especially for partially sighted people or on a screen outdoors.",
        wrong: "No. It keeps the text comfortably readable for anyone and prevents eye strain."
      }
    },
    {
      q: "What does 'keyboard navigability' mean?",
      options: [
        "How fast the user can type.",
        "Being able to navigate and interact with everything on the site (links, buttons, forms) using only the Tab and Enter keys.",
        "Using keyboard shortcuts in VS Code."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! Someone with a motor impairment may not be able to use a mouse. They need to do everything by tabbing from one control to the next.",
        wrong: "No. It lets people who have motor difficulties or do not use a mouse complete actions on the site with the keyboard alone."
      }
    },
    {
      q: "What is the visible 'focus' indicator (usually a coloured outline) on active elements for?",
      options: [
        "Decorating the page with random coloured borders.",
        "Showing keyboard users which element (link or button) is currently selected.",
        "Hiding the mouse cursor."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It is the keyboard's equivalent of the mouse pointer. Removing it makes it impossible to tell where you are.",
        wrong: "No. It is the visual pointer for the keyboard: it highlights the active element as you move with Tab."
      }
    },
    {
      q: "What are the WCAG (Web Content Accessibility Guidelines)?",
      options: [
        "The legal regulations for buying internet domains.",
        "The international reference standards defining what is required to make web content accessible.",
        "NPM packages for optimising CSS."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! They are the standards written by the W3C, split into levels (A, AA, AAA), used to measure legal accessibility compliance.",
        wrong: "No. They are the international technical specification for accessibility conformance."
      }
    },
    {
      q: "Why is removing the focus outline ('outline: none' or 'outline: 0') without a visual replacement such a serious mistake?",
      options: [
        "Because Vite will report a blocking compilation error.",
        "Because it makes the site unusable for keyboard users, who can no longer tell where they are on the page.",
        "Because it hurts the site's SEO on Google."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! Hide the outline and keyboard users are navigating blind, which makes the site impractical. If you remove it, replace it with a custom `:focus` style.",
        wrong: "No. It blinds keyboard navigation and shuts out a significant group of users."
      }
    },
    {
      q: "In a form, why should every field be associated with a visible '&lt;label&gt;' tag?",
      options: [
        "It enlarges the field's clickable area and clearly communicates the input's purpose to screen readers.",
        "It colours the field's background when there is an error.",
        "It sends the data to the database encrypted."
      ],
      correct: 0,
      feedback: {
        correct: "Exactly! Clicking the label moves the cursor into the input, and a screen reader announces the label text as soon as the user reaches the field.",
        wrong: "No. It ties the descriptive text to its field, improving both the clickable area and how it is announced."
      }
    },
    {
      q: "What does the ARIA attribute 'aria-hidden=\"true\"' indicate?",
      options: [
        "That the element should be visually hidden from the screen for all users.",
        "That the element is purely decorative and should be ignored by screen readers so it does not cause confusion.",
        "That the element contains secret administration data."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! If an element (a decorative icon next to some text, say) adds no information, `aria-hidden=\"true\"` stops the screen reader announcing it pointlessly.",
        wrong: "No. It hides the element from the screen reader's accessibility tree while leaving it visible on screen."
      }
    }
  ],
  "seo-tecnico-base": [
    {
      q: "What is SEO (Search Engine Optimization)?",
      options: [
        "The process of writing JavaScript to turn a site into a PWA.",
        "The set of techniques for optimising a site to improve its visibility and ranking in organic search results.",
        "A security protocol for protecting user data."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It helps engines like Google understand what your site is about, so it shows up for people searching related terms.",
        wrong: "No. It improves the site's relevance and position in the unpaid results of search engines."
      }
    },
    {
      q: "Why is the '&lt;title&gt;' tag considered one of the most important SEO elements?",
      options: [
        "Because it sets the font colour of the main heading.",
        "Because it appears in Google's results as the clickable title and states clearly what the page is about.",
        "Because it is the only strictly mandatory HTML tag."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It is the first element crawlers read and the first thing a user's eye lands on in the results.",
        wrong: "No. It is the blue clickable title shown by search engines, and it is crucial both for attracting clicks and for indexing."
      }
    },
    {
      q: "What is the meta description tag for?",
      options: [
        "Giving Google a summary of the page, which often appears as the snippet under the title in search results.",
        "Loading preconnected Google fonts.",
        "Setting the site's cover image."
      ],
      correct: 0,
      feedback: {
        correct: "Exactly! Even though it does not directly affect ranking maths, a good description is what persuades people to click your link.",
        wrong: "No. It is the grey descriptive text shown under the blue title in Google's results."
      }
    },
    {
      q: "What is the 'canonical' tag (&lt;link rel=\"canonical\" href=\"...\"&gt;)?",
      options: [
        "A tag that makes the site work on mobile devices.",
        "A signal to search engines declaring a page's official URL, which prevents duplicate-content problems.",
        "The tag that links the main CSS stylesheet."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! If a page is reachable from several URLs, the canonical tells Google which one to index, avoiding trouble over duplicated text.",
        wrong: "No. It specifies the preferred main URL, which heads off the duplicate-content problem."
      }
    },
    {
      q: "What is a website's sitemap?",
      options: [
        "An interactive graphical map to stop users getting lost.",
        "An XML file listing the site's URLs to help search engine crawlers find and index the pages.",
        "The schema of the server's MySQL database."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It is the site's index, written for Google. It flags that each page exists, which speeds up indexing.",
        wrong: "No. It is an XML data file listing the addresses of the live pages to make life easier for search engines."
      }
    },
    {
      q: "What is the 'robots.txt' file for?",
      options: [
        "Blocking hacker attacks on the server.",
        "Giving search engine crawlers instructions about which areas or pages of the site they should not crawl.",
        "Configuring the automatic replies of a support chat."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It restricts access to private or administrative folders (`/admin/`, for example), which also saves crawl budget.",
        wrong: "No. It is the guide for crawlers, defining which parts of the site should not be explored or catalogued."
      }
    },
    {
      q: "What are 'social cards' (the Open Graph protocol)?",
      options: [
        "Special credit cards for buying things on social networks.",
        "Metadata (title, description, image) defining how your site's link looks when it is shared on social platforms.",
        "The icons used in the menu bar."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! They set the og:title, og:image and similar tags, controlling how links look when sent on WhatsApp, Facebook or Telegram.",
        wrong: "No. They handle the visual preview metadata shown when a link is shared on social platforms."
      }
    },
    {
      q: "How does loading performance (site speed) affect SEO?",
      options: [
        "It has no effect at all; Google only evaluates text.",
        "A slow site gives a poor experience, pushes the bounce rate up, and is penalised by Google in the rankings.",
        "It speeds up indexing at the expense of security."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! Google made loading speed (Core Web Vitals) an official ranking factor.",
        wrong: "No. Slowness ruins the browsing experience and leads directly to a penalty in SEO rankings."
      }
    },
    {
      q: "What is Google Search Console?",
      options: [
        "A Chrome extension for editing SEO tags.",
        "A free Google tool for monitoring your site's presence, indexing, errors and search traffic.",
        "The cloud server Google's search engine runs on."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It warns you about unindexed pages and crawl errors, and shows you which keywords people use to find you.",
        wrong: "No. It is Google's diagnostic dashboard for monitoring and improving real organic indexing."
      }
    },
    {
      q: "What does 'mobile-friendly SEO' mean?",
      options: [
        "Building a mobile app that people download from the Google and Apple stores.",
        "Designing and optimising the site so it reads and navigates perfectly on a phone — a fundamental criterion for Google's indexing.",
        "Adding a dialling code to your contact details."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! Google crawls mobile-first: it analyses the site starting from the phone version. If that version reads badly, the site will not climb.",
        wrong: "No. It means optimising the site's usability and loading for browsing on a phone."
      }
    }
  ],
  "github-operativo": [
    {
      q: "What is the fundamental difference between Git and GitHub?",
      options: [
        "Git is the local version-control tool; GitHub is a cloud platform that hosts Git repositories online.",
        "GitHub is a programming language, Git is a text editor.",
        "Git only runs on Mac, GitHub only on Windows."
      ],
      correct: 0,
      feedback: {
        correct: "Exactly! Git works locally on your machine with no internet. GitHub is the web service that lets you put repositories online and collaborate.",
        wrong: "No. Git is the local tracking engine; GitHub is the cloud service for sharing and social coding."
      }
    },
    {
      q: "What does the 'git push' command do?",
      options: [
        "Downloads updates from the remote server to the local computer.",
        "Sends your local commits to the remote repository on GitHub to sync them.",
        "Deletes the local development branch."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It 'pushes' your local history to the remote server, making your commits visible and downloadable by others.",
        wrong: "No. It transfers the commits recorded locally to the remote server online (GitHub, for instance)."
      }
    },
    {
      q: "What does the 'git pull' command do?",
      options: [
        "Downloads changes from the remote repository and merges them straight into your active local branch.",
        "Sends local changes to the GitHub server.",
        "Renames the repository online."
      ],
      correct: 0,
      feedback: {
        correct: "Exactly! It 'pulls' changes down from the server and brings your local working folder into line (it is a shortcut for fetch + merge).",
        wrong: "No. It downloads remote updates and integrates them straight into your active local code."
      }
    },
    {
      q: "What is a pull request (PR) on GitHub for?",
      options: [
        "Requesting a ZIP download of the project.",
        "Proposing changes from one branch to another, allowing discussion, code review and testing before the merge.",
        "Reporting a bug in third-party code."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It is the foundation of collaborative work: you propose your changes and let colleagues examine and test them before approving.",
        wrong: "No. It is a formal merge proposal, enriched with reviews, comments and discussion."
      }
    },
    {
      q: "What are 'issues' in a GitHub project?",
      options: [
        "Fatal errors that stop the site loading.",
        "A tool for tracking bugs, proposing new ideas, asking questions or organising development work.",
        "Log files created automatically during the build."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! They work as a work board — a public to-do list — for discussing bugs or ideas for the project.",
        wrong: "No. They are cards for reporting and tracking tasks, problems and ideas relating to the code."
      }
    },
    {
      q: "What is the GitHub Pages service for?",
      options: [
        "Editing HTML straight from the browser.",
        "Hosting and publishing static websites for free, directly from a GitHub repository.",
        "Storing large database files."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It takes the HTML/CSS/JS files you committed to a branch and serves them as a public website under the github.io domain.",
        wrong: "No. It is the free static hosting service built into GitHub."
      }
    },
    {
      q: "What does 'forking' a repository mean?",
      options: [
        "Deleting the original project.",
        "Creating your own copy of someone else's repository in your GitHub account so you can make changes freely.",
        "Merging two different repositories."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It creates an online duplicate under your control. Useful for contributing to open source projects and then sending a pull request.",
        wrong: "No. It produces an identical copy of the original repository attached to your own account."
      }
    },
    {
      q: "What are GitHub Actions?",
      options: [
        "Keyboard shortcuts for using the site faster.",
        "An automation system (CI/CD) that runs scripts (tests, builds, deployments) in response to events such as a push.",
        "Visual extensions for changing GitHub's theme."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! They let you automate complex flows, such as compiling production code or running the tests every time you push.",
        wrong: "No. They are automated workflows run on GitHub's servers to build, test or publish your code."
      }
    },
    {
      q: "Why is committing files like '.env' or API keys to GitHub dangerous?",
      options: [
        "Because they bloat the repository's size.",
        "Because repositories — especially public ones — are scanned by bots ready to steal credentials and abuse them.",
        "Because Vite will report a build error."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! Automated bots constantly comb GitHub for AWS, database or payment API credentials, and can exploit them at your expense within seconds.",
        wrong: "No. It is a very serious security risk, because it exposes private credentials to unauthorised access."
      }
    },
    {
      q: "How do you clone a repository from GitHub to your own computer?",
      options: [
        "By copying the files one at a time with drag and drop.",
        "By using the 'git clone' command followed by the repository's URL.",
        "By downloading the GitHub desktop app and dragging the folder in."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! `git clone URL` downloads the entire history to a local folder and wires up the origin remote automatically.",
        wrong: "No. `git clone` is the right command for downloading and initialising a local copy of the online repository."
      }
    }
  ],
  "git-pratico-senza-panico": [
    {
      q: "What is the main purpose of a version control system like Git?",
      options: [
        "Making manual zip backups every day.",
        "Tracking the history of changes to your files, so you can collaborate and go back in time.",
        "Speeding up the server's internet connection."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! Git records every change, giving you a historical diary of the project and a safety net for restoring old files.",
        wrong: "No. It automates historical change tracking in a far more powerful way than simple zip backups."
      }
    },
    {
      q: "In Git, what is the 'working tree' (or working directory)?",
      options: [
        "The state of the files stored on the remote GitHub server.",
        "The physical folder on your computer where you are actively editing the project's files.",
        "The list of branches ready to merge."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! The working tree holds the files in the state you currently see and edit on your computer.",
        wrong: "No. It is the physical files on your hard disk in the working directory."
      }
    },
    {
      q: "What is the staging area (or index) for in Git?",
      options: [
        "Publishing changes straight to the live website.",
        "Acting as a preparation area where you pick which changes go into the next commit.",
        "Deleting recent history."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It is the waiting room for changes. When you run `git add`, you move files here, ready to be saved by the commit.",
        wrong: "No. Its only job is to prepare and gather the files that will be saved permanently by the next commit."
      }
    },
    {
      q: "What does 'git status' do?",
      options: [
        "Shows the health of your computer.",
        "Shows which files have been modified, which are staged and which are not yet tracked.",
        "Pushes commits to the remote server."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It is the essential dashboard for knowing at any moment what Git sees as changed and what is ready to be saved.",
        wrong: "No. It is a purely informational command about the state of your local files relative to Git's history."
      }
    },
    {
      q: "What is the purpose of 'git commit -m \"message\"'?",
      options: [
        "Saving a permanent snapshot of the staged changes, along with a description.",
        "Downloading changes from the remote server.",
        "Creating a new development branch."
      ],
      correct: 0,
      feedback: {
        correct: "Exactly! It creates a fixed point in the history — a commit — with a description of the change's intent.",
        wrong: "No. It permanently saves the changes in the staging area into the local repository's story."
      }
    },
    {
      q: "What is a branch for in Git?",
      options: [
        "Creating a backup copy of the database.",
        "Isolating work on a new feature or fix without disturbing the main code (main).",
        "Speeding up Vite's builds."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It lets you work in parallel without risking the stable version of the code until the work is finished.",
        wrong: "No. It is a parallel line of development for isolating changes and experimental features."
      }
    },
    {
      q: "What happens during a 'git merge'?",
      options: [
        "All the commits on the current branch are deleted.",
        "The changes from a secondary branch are brought into the active branch (main, for example).",
        "The project is exported as a ZIP package."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It joins the histories of two different branches, integrating the specified branch's code into the one you are on.",
        wrong: "No. It combines the history and the changes of two different development branches."
      }
    },
    {
      q: "What is the main difference between 'git restore' and 'git revert'?",
      options: [
        "Restore discards uncommitted local changes; revert creates a new commit that undoes the effects of a past commit.",
        "There is no difference, they are identical commands.",
        "Restore deletes Git's history; revert restores the node_modules folder."
      ],
      correct: 0,
      feedback: {
        correct: "Exactly! Restore works on your local working area, throwing away the current mess. Revert leaves the past intact and creates a new, opposing commit.",
        wrong: "No. Restore cleans up the local working tree; revert writes a corrective commit to make up for a mistake already recorded in the history."
      }
    },
    {
      q: "What is the reflog in Git?",
      options: [
        "A local log tracking every movement of HEAD, acting as a safety net for recovering lost commits.",
        "GitHub's remote repository database.",
        "A tool for compressing images during a build."
      ],
      correct: 0,
      feedback: {
        correct: "Exactly! Even after a destructive reset, the reflog keeps the old references, letting you find and recover almost anything.",
        wrong: "No. It is the secret logbook of your local HEAD movements — Git's ultimate safety net."
      }
    },
    {
      q: "What is the '.gitignore' file for?",
      options: [
        "Making Git commands run faster in the terminal.",
        "Specifying which files or folders (node_modules, secret keys) Git should ignore and never track.",
        "Changing the terminal's colour theme."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It stops you cluttering the repository with enormous dependencies or, worse, publishing private files and API keys.",
        wrong: "No. It tells Git which files to leave out of historical tracking permanently."
      }
    }
  ],
  "ai-sviluppo-solido": [
    {
      q: "What is the main risk of relying blindly on AI code generation?",
      options: [
        "That your text editor uninstalls itself.",
        "Introducing latent logic bugs, redundant code or security holes without noticing, because nobody reviewed it critically.",
        "Paying excessive internet traffic charges."
      ],
      correct: 1,
      feedback: {
        correct: "A plausible answer may still miss the expected behaviour or project context. Check it before adding it.",
        wrong: "Generated code can look correct and still contain bugs, unhandled cases or security risks."
      }
    },
    {
      q: "What makes an AI request useful during software development?",
      options: [
        "Filling in the AI's support forms.",
        "Describe the expected result, provide relevant context and state the constraints that matter.",
        "Installing AI servers on your computer."
      ],
      correct: 1,
      feedback: {
        correct: "A clear request reduces the decisions left to the assistant; you still need to check the answer.",
        wrong: "Goal, context and relevant constraints help the assistant understand what you need."
      }
    },
    {
      q: "How can an AI assistant help with your work?",
      options: [
        "By letting it write whole code files that you never inspect.",
        "It can explain code, draft a change or look for problems while you check whether the result fits the project.",
        "By using it only for Google searches."
      ],
      correct: 1,
      feedback: {
        correct: "An assistant can help with different tasks, but compare the result with the expected behaviour and verify it.",
        wrong: "An assistant can propose work; it cannot certify by itself that the result is right for the project."
      }
    },
    {
      q: "Why does giving the AI 'context' matter when you make a request?",
      options: [
        "To stop the AI's server timing out.",
        "So the AI can generate code compatible with your project's stack, conventions and specific architecture.",
        "To make the chat respond faster."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! With no context, the AI proposes generic answers that may not work, or may clash with your code's rules.",
        wrong: "No. It lets you get code consistent with the libraries and structure already in use."
      }
    },
    {
      q: "What does 'critical review' of AI-generated code mean?",
      options: [
        "Sending the code to a senior colleague before deploying.",
        "Check the change against the goal, review relevant cases and run appropriate checks before integrating it.",
        "Using an automatic debugger."
      ],
      correct: 1,
      feedback: {
        correct: "Check the change against the goal, important cases and relevant checks before integrating it.",
        wrong: "Review means understanding the change's impact and checking that the expected behaviour holds."
      }
    },
    {
      q: "What are constraints ('use vanilla JS only', 'no external libraries') for in a prompt?",
      options: [
        "Reducing the carbon footprint of the AI's server.",
        "Steering the AI towards solutions that comply with the project's rules and limits, and away from unnecessary code.",
        "Speeding up Vite's builds."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! They narrow the space of possible answers, so the AI does not propose unwanted dependencies or incompatible methods.",
        wrong: "No. They force the AI to produce answers that comply with the project's predefined technical specifications."
      }
    },
    {
      q: "What is a good practice for solving a complex bug with the AI's help?",
      options: [
        "Pasting the whole project into the AI chat with no explanation.",
        "Isolating the bug, supplying the relevant snippet, describing the expected behaviour and pasting the exact terminal error.",
        "Ignoring the AI and rewriting the code from scratch."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! Clean data — the source code plus the exact compiler error — lets the AI locate the problem far faster.",
        wrong: "No. Isolating the problem and supplying the error log is the best way to steer the AI towards a solution."
      }
    },
    {
      q: "What is the difference between MCP and a skill?",
      options: [
        "MCP provides reusable instructions; a skill connects the assistant to external services.",
        "MCP connects an AI application to external data or tools; a skill describes a reusable procedure.",
        "They are two names for the same feature."
      ],
      correct: 1,
      feedback: {
        correct: "MCP provides connections to tools or data; a skill explains how to complete a workflow. Always check access and permissions.",
        wrong: "MCP connects to tools and data; a skill provides instructions and resources for a procedure."
      }
    },
    {
      q: "How can AI support writing unit tests?",
      options: [
        "By running the tests on remote servers in real time.",
        "By quickly generating test cases and covering different scenarios (edge cases, invalid input) based on the code you supply.",
        "By removing the need to run a build at all."
      ],
      correct: 1,
      feedback: {
        correct: "It can suggest test cases, but you need to check and run them to see whether they catch the problems.",
        wrong: "Generated tests are suggestions: check they cover the required behaviour, then run them."
      }
    },
    {
      q: "If you are learning, how can you use AI without skipping the learning?",
      options: [
        "Ignoring it as a passing fad with no practical use.",
        "Ask it to explain a concept, try an exercise and check whether you can apply the idea to a similar case.",
        "Delegating every design decision so you can program without studying."
      ],
      correct: 1,
      feedback: {
        correct: "Using the answer as an explanation, then trying it yourself, helps you check whether you understood.",
        wrong: "Copying a solution without understanding it does not show that you can apply the concept."
      }
    }
  ],
  "vscode-essenziale": [
    {
      q: "What is the Command Palette's main purpose in VS Code?",
      options: [
        "Changing the operating system's colour theme.",
        "Reaching any editor command, setting or action quickly by typing a search.",
        "Starting a voice call with other developers."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! The Command Palette gathers every command in VS Code and its extensions into one convenient search bar.",
        wrong: "No. It is for reaching VS Code's internal commands, settings and actions."
      }
    },
    {
      q: "Which key combination opens the Command Palette on Windows/Linux?",
      options: [
        "Ctrl + Alt + Del",
        "Ctrl + Shift + P (or F1)",
        "Ctrl + S"
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! The classic combination is Ctrl+Shift+P (Cmd+Shift+P on macOS). F1 works too.",
        wrong: "No. Ctrl+S saves the current file, and Ctrl+Alt+Del is for system options."
      }
    },
    {
      q: "What is a 'workspace' in VS Code?",
      options: [
        "A project folder opened in the editor, containing all its files and related configuration.",
        "An extension for sharing your screen.",
        "A paid Microsoft cloud service."
      ],
      correct: 0,
      feedback: {
        correct: "Exactly! Opening a folder as a workspace lets VS Code index the files, run global searches and store project-specific settings.",
        wrong: "No. It is simply your project's main folder, opened inside the editor."
      }
    },
    {
      q: "What is the integrated terminal in VS Code for?",
      options: [
        "Browsing the internet without a browser.",
        "Running system commands, builds and npm scripts straight from the editor without switching windows.",
        "Chatting with the AI assistant."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It saves you constantly switching applications to run things like 'npm run dev' or Git commands.",
        wrong: "No. It is for running command lines and development tools in the current project directory."
      }
    },
    {
      q: "What is the best practice for installing extensions in VS Code?",
      options: [
        "Installing every recommended extension to climb the rankings.",
        "Installing only the extensions your workflow genuinely needs, keeping the editor light.",
        "Installing only extensions made by Microsoft."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! Hundreds of idle extensions slow down VS Code's startup and eat RAM. Install only what you actually use.",
        wrong: "No. Too many extensions weigh the editor down and hurt its performance. Keep them to a minimum."
      }
    },
    {
      q: "What does Quick Open (Ctrl + P) do?",
      options: [
        "Opens the editor in full-screen mode.",
        "Finds and opens any file in the project quickly, by typing its name.",
        "Deletes temporary files."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! Ctrl+P (Cmd+P on Mac) lets you jump between the project's files by typing just a few letters of the name.",
        wrong: "No. It is the fastest way to find and jump to a specific file in the open folder."
      }
    },
    {
      q: "What does the Prettier extension do in VS Code?",
      options: [
        "Translates code comments into English.",
        "Formats code automatically so it is tidy and consistent according to standard rules.",
        "Checks for logic bugs before the code runs."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! On save it normalises spacing, commas, line breaks and alignment, taking that tedious job off your hands.",
        wrong: "No. It is a code formatter: it does not detect logic errors and it does not translate anything."
      }
    },
    {
      q: "What is the Source Control panel in VS Code for?",
      options: [
        "Storing media files.",
        "Handling Git operations (add, commit, branch) through a graphical interface.",
        "Compiling CSS stylesheets."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It lets you stage changes, write commit messages and push/pull graphically, without touching the terminal.",
        wrong: "No. It is for interacting with Git visually, to track and save your code changes."
      }
    },
    {
      q: "What happens if you use Alt + Click (or Option + Click on Mac) in a code file?",
      options: [
        "The selected line is deleted.",
        "Multiple cursors are created, so you can type in several different places at once.",
        "The language's online documentation opens."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! Multiple cursors are superb for making identical edits across several lines at the same moment.",
        wrong: "No. It places an extra cursor at each click, letting you type in parallel."
      }
    },
    {
      q: "What is the Problems panel at the bottom of VS Code for?",
      options: [
        "Reporting the computer's internet connection problems.",
        "Showing syntax errors and warnings detected in the open files, in real time.",
        "Sending bug reports to the VS Code team."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! It collects everything the code linters flag, so you can fix it before the build.",
        wrong: "No. It detects and displays compilation and formatting errors in the files active in your editor."
      }
    }
  ],
  "html-fondamentali": [
    {
      q: "What is the main purpose of semantic HTML?",
      options: [
        "Defining the colour, arrangement and visual style of a page's elements.",
        "Describing the meaning and role of the various pieces of content (headings, articles, menus) for browsers and search engines.",
        "Adding motion effects and interactivity on mouse click."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! Semantic HTML clarifies the structural meaning of content (an &lt;article&gt; tag marks a real article), which helps Google index it and improves accessibility.",
        wrong: "Not quite. Visual styling belongs to CSS and interactivity to JavaScript. Semantic HTML describes the structural meaning of the data."
      }
    },
    {
      q: "What is the correct rule when you nest one tag inside another?",
      options: [
        "Text-level tags (bold, italic) can go inside structural tags (paragraphs, containers).",
        "Large structural tags (headings, whole paragraphs) can go inside small inline text elements such as a span.",
        "There are no rules; tags can be crossed freely with no particular closing order."
      ],
      correct: 0,
      feedback: {
        correct: "Exactly! Text-level tags (&lt;strong&gt;, &lt;em&gt;) always go inside structural containers (&lt;p&gt;, &lt;div&gt;), never the other way round. And the tag opened last must always be closed first.",
        wrong: "Wrong. You cannot put large elements (headings, div blocks) inside small text-level tags. And tags can never be crossed: the last tag opened must be the first one closed."
      }
    },
    {
      q: "What happens if you add an image to your code and leave out the alt attribute?",
      options: [
        "The browser refuses to load the image and shows a black error screen.",
        "Vite blocks the build, reporting an unrecoverable syntax error.",
        "The site becomes inaccessible to screen reader users (people with visual impairments) and is penalised in search results."
      ],
      correct: 2,
      feedback: {
        correct: "Exactly! A missing or badly written 'alt' attribute stops screen readers describing the image to people who cannot see it, and limits how the site is indexed by Google.",
        wrong: "Not quite. The browser will still load the image and Vite will build without errors, but you will have done serious harm to the site's accessibility and SEO."
      }
    },
    {
      q: "What is the correct use of the line-break tag &lt;br&gt;?",
      options: [
        "Spacing two paragraphs apart or creating empty vertical gaps in the layout for visual reasons.",
        "Forcing a line break inside the same block of text (for addresses or poems, say).",
        "Creating a decorative horizontal rule to separate two chapters."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! The &lt;br&gt; tag is only for breaking a line within text. To space visual elements apart, use margins and padding in CSS.",
        wrong: "No. Using &lt;br&gt; to space elements out is a common mistake; visual spacing must be handled exclusively with CSS margins."
      }
    },
    {
      q: "In HTML, how should the heading hierarchy (&lt;h1&gt; to &lt;h6&gt;) be handled?",
      options: [
        "According to the visual size of the text you want on screen.",
        "In logical numeric order (h1 -> h2 -> h3), starting from a single main &lt;h1&gt; per page.",
        "Using only &lt;h1&gt; headings to maximise relevance on Google."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! Headings structure the page logically, like a book's table of contents. Font size is set with CSS.",
        wrong: "Wrong. Choosing heading tags by visual size wrecks the site's accessibility. The hierarchy must follow a logical order (h1 -> h2 -> h3)."
      }
    },
    {
      q: "What is the main difference between the &lt;head&gt; section and the &lt;body&gt;?",
      options: [
        "The &lt;head&gt; holds invisible information and metadata; the &lt;body&gt; holds everything visible on screen.",
        "The head is for loading the CSS stylesheet, while the body is only for JavaScript.",
        "The head is downloaded after the body, to speed up loading."
      ],
      correct: 0,
      feedback: {
        correct: "Exactly! The head holds metadata, stylesheets, fonts and settings used by browsers and search engines. The body holds what the user sees and interacts with.",
        wrong: "Not correct. The head holds structural information invisible to the user, and it is loaded before the body to establish the basic rules."
      }
    },
    {
      q: "Which of these links is the correct use of a relative link?",
      options: [
        "&lt;a href='https://google.com'&gt;Google&lt;/a&gt;",
        "&lt;a href='/tutorials/css-fundamentals/'&gt;CSS fundamentals&lt;/a&gt;",
        "&lt;a href='mailto:info@example.com'&gt;Write to us&lt;/a&gt;"
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! A relative link points at a resource on the same domain without repeating the site's name (e.g. '/about/').",
        wrong: "No. A URL beginning with 'https://' is an absolute link (it points outwards), and 'mailto:' is an email link."
      }
    },
    {
      q: "What are the generic &lt;div&gt; (block) and &lt;span&gt; (inline) tags for?",
      options: [
        "Defining important semantic sections of text, such as articles or biographies.",
        "Acting as neutral boxes and containers for applying CSS styles or JavaScript logic.",
        "Embedding images, video and media files in the page."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! Div (block) and span (inline) are neutral tags with no semantic meaning, ideal for grouping elements for styling or scripting.",
        wrong: "No. They carry no semantic meaning (unlike article, section or strong), and they are not for loading media."
      }
    },
    {
      q: "Which of these tags is self-closing?",
      options: [
        "&lt;p&gt; (paragraph)",
        "&lt;img&gt; (image)",
        "&lt;ul&gt; (list)"
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! The &lt;img&gt; tag encloses no text and is self-closing, taking its source from the 'src' attribute.",
        wrong: "Wrong. The &lt;p&gt; and &lt;ul&gt; tags always need their closing tag (&lt;/p&gt; and &lt;/ul&gt;)."
      }
    },
    {
      q: "What is the correct way to connect a &lt;label&gt; to an &lt;input&gt; field in a form?",
      options: [
        "Give both elements the same value for the 'name' attribute.",
        "Use the 'for' attribute on the label, with the same value as the input's 'id'.",
        "Place the label straight after the input, with no connection in the code."
      ],
      correct: 1,
      feedback: {
        correct: "Exactly! The label's 'for' attribute must exactly match the input's id. That is what lets screen readers associate the text with its field.",
        wrong: "No. The 'name' attribute identifies the data sent to the server, while for accessibility and interaction you must use for/id."
      }
    }
  ]
};
