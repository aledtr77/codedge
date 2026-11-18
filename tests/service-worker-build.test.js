import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import serviceWorkerVersionPlugin from '../scripts/service-worker-plugin.mjs';

const directories = [];
afterEach(() => directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

function build() {
  const directory = mkdtempSync(join(tmpdir(), 'codedge-worker-version-'));
  directories.push(directory);
  mkdirSync(join(directory, 'images'));
  writeFileSync(join(directory, 'images/example.webp'), 'first image');
  writeFileSync(join(directory, 'index.html'), '<h1>Codedge</h1>');
  function run() {
    writeFileSync(join(directory, 'sw.js'), 'const version = "__CODEDGE_BUILD_VERSION__";');
    serviceWorkerVersionPlugin(directory).closeBundle.handler.call({ error: (message) => { throw new Error(message); } });
    return readFileSync(join(directory, 'sw.js'), 'utf8');
  }
  return { directory, run };
}

describe('service worker release version', () => {
  it('is reproducible for identical build output', () => {
    const fixture = build();
    const first = fixture.run();
    expect(first).toMatch(/"[a-f0-9]{16}"/);
    expect(fixture.run()).toBe(first);
  });

  it('changes when an image is edited without renaming it', () => {
    const fixture = build();
    const first = fixture.run();
    writeFileSync(join(fixture.directory, 'images/example.webp'), 'updated image');
    expect(fixture.run()).not.toBe(first);
  });

  it('changes when a document changes', () => {
    const fixture = build();
    const first = fixture.run();
    writeFileSync(join(fixture.directory, 'index.html'), '<h1>Updated</h1>');
    expect(fixture.run()).not.toBe(first);
  });
});
