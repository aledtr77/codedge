# Agent Rules

Written in English so there is one copy of every rule. Nothing here is repeated in
another language: a second copy is a second thing to keep in sync, and the two drift.

## Git

- **Commits are fine.** Commit the changes you make. Write every message in English —
  subject and body — whatever language the conversation is in.
- **Never push.** Do not run `git push` under any circumstances. Pushing is the user's,
  from the terminal.

## Code

- **No `!important`.** If a rule needs it, the specificity underneath it is wrong — fix
  that instead.
- **No duplicate CSS.** One rule, one place.
- **No inline JavaScript** in HTML or in components. Behaviour stays in its own file.
- **Descriptive names** for variables, functions, classes and every other identifier.
- **Comment only what isn't obvious** — non-obvious logic, structural decisions, the
  reason a thing is done the awkward way. Not what the line already says.
- **No workarounds.** Write the solution, not the patch that hides the problem.
- **Structural problems get proposed, not buried.** If the fix belongs one level down,
  say so and refactor there rather than stacking more code on top.

## Verifying

A change that "should work" is not finished. See `.claude/skills/verify/SKILL.md` for
how to build and drive the site: the parts that run without a DOM are covered by
`npm test`, and the rest is checked in a browser, which is the only place it can be
checked.
