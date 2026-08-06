// Moving a file is not editing it, and git will tell you otherwise.
//
// Both dates the site publishes come out of git, and both were wrong the same
// way: `git log -1 -- <path>` counts the commit that moved a file as the last
// time it changed, and `git log --diff-filter=A -- <path>` reads the move as
// the file's creation, because limiting the diff to the new path hides the
// deletion side of the rename. On 6 August 2026 that put today's date on 64 of
// the 68 URLs in the sitemap and moved one guide's datePublished forward by
// three and a half months.
//
// Neither failure is visible on the page, and by the time a crawler has stopped
// trusting the dates there is nothing to look at. So the checks run against a
// real repository built here, commit by commit, with a rename in the middle.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fileDates } from '../scripts/lib/git-dates.mjs';

let repo;
const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' });

// Dates far enough apart that a mix-up cannot hide behind a same-day comparison.
const CREATED = '2026-01-10T10:00:00+00:00';
const EDITED = '2026-03-20T10:00:00+00:00';
const MOVED = '2026-08-06T10:00:00+00:00';

function commit(message, date) {
  git('add', '-A');
  execFileSync('git', ['commit', '-q', '-m', message], {
    cwd: repo,
    env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
  });
}

beforeAll(() => {
  repo = mkdtempSync(join(tmpdir(), 'git-dates-'));
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');

  writeFileSync(join(repo, 'old-name.js'), 'export const answer = 41;\n');
  commit('add the file', CREATED);

  writeFileSync(join(repo, 'old-name.js'), 'export const answer = 42;\n');
  commit('fix the answer', EDITED);

  // The rename this whole file exists for: same bytes, new path.
  git('mv', 'old-name.js', 'new-name.js');
  commit('rename it and nothing else', MOVED);

  // A second file, moved together with the first but also edited in the move —
  // that one did change, and has to keep the later date.
  writeFileSync(join(repo, 'edited-in-the-move.js'), 'a\n'.repeat(20));
  commit('add the second file', CREATED);
  writeFileSync(join(repo, 'edited-in-the-move.js'), `${'a\n'.repeat(19)}b\n`);
  git('mv', 'edited-in-the-move.js', 'moved-and-edited.js');
  commit('move it and change it', MOVED);
});

afterAll(() => {
  if (repo) rmSync(repo, { recursive: true, force: true });
});

describe('fileDates', () => {
  it('does not count a pure rename as a modification', () => {
    expect(fileDates(repo, 'new-name.js').modified.slice(0, 10)).toBe('2026-03-20');
  });

  it('follows the rename back to the commit that created the file', () => {
    expect(fileDates(repo, 'new-name.js').created.slice(0, 10)).toBe('2026-01-10');
  });

  it('is not the naive git call, which would answer with the rename', () => {
    // The bug, reproduced: this is what the code used to ask for.
    const naive = execFileSync('git', ['log', '-1', '--format=%cI', '--', 'new-name.js'], {
      cwd: repo, encoding: 'utf8',
    }).trim();
    expect(naive.slice(0, 10)).toBe('2026-08-06');
    expect(fileDates(repo, 'new-name.js').modified.slice(0, 10)).not.toBe(naive.slice(0, 10));
  });

  it('still counts a rename that changed the file too', () => {
    expect(fileDates(repo, 'moved-and-edited.js').modified.slice(0, 10)).toBe('2026-08-06');
  });

  it('gives a file that was only ever added its creation date, not null', () => {
    writeFileSync(join(repo, 'untouched.js'), 'export const x = 1;\n');
    commit('add a file nobody has touched since', CREATED);
    const dates = fileDates(repo, 'untouched.js');
    expect(dates.created.slice(0, 10)).toBe('2026-01-10');
    expect(dates.modified.slice(0, 10)).toBe('2026-01-10');
  });

  it('answers with nulls for a path git knows nothing about, rather than throwing', () => {
    expect(fileDates(repo, 'never-existed.js')).toEqual({ created: null, modified: null });
  });
});
