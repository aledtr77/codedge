# Security maintenance

The maintained version is the latest commit on `main`. The published site is a
static Cloudflare Pages build; image tools process files locally in the browser.
The contact form sends its submitted fields to EmailJS.

## Reporting a vulnerability

Send a reproducible security issue to **contatti.codedge@gmail.com**. Include the
affected URL or commit, browser, steps and impact. Please keep exploit details
out of public issues until a fix can be reviewed.

## Dependency updates

- Use `npm ci` and commit `package-lock.json` with dependency changes.
- Run `npm audit` against the entire tree, including development tools. Any
  reported severity blocks the deployment workflow. Review the advisory and
  compatibility before updating; do not use `npm audit fix --force` blindly.
- Dependabot checks npm packages and GitHub Actions weekly. Updates go through
  the same checks as other pull requests; they are not automatically merged.
- The scheduled workflow audits the default branch weekly without deploying.
- Actions are pinned to commit SHAs, repository permissions are read-only and
  deployment secrets are only passed to the deployment step on a `main` push.

## Browser and offline checks

After `npm run build`, run `npm run test:smoke`, `npm run test:security`,
`npm run test:css-labs`, `npm run i18n:swap` and `npm run test:a11y`. The shared server applies the
build's `_headers`, so checks exercise the CSP that ships to Cloudflare.

The CSP permits exact build-generated hashes for required early scripts,
disallows inline event handlers and JavaScript evaluation, and permits
WebAssembly compilation for AVIF. HTML/CSS previews run in opaque sandboxed
iframes with a separate restrictive policy; only the preview helper may execute.
Saved quiz results are validated and rendered through text nodes.

Each build fingerprints its output into the service worker version, including
public images. Runtime caching is limited to 160 entries and skips responses
declared private, non-cacheable or larger than 8 MiB by Content-Length. Mutable
resources use network revalidation with a five-second response timeout. Unit and
browser checks cover storage failures, concurrent eviction, offline documents,
missing resources and updated public images.

External service account settings, domain administration and Cloudflare account
permissions need to be managed in their respective accounts; repository checks
do not inspect those settings.
