// The half of the contract this repo can enforce.
//
// See scripts/colour-contract.mjs for why the fixture exists: the palette
// extractor's colour maths lives in two independent repos, and until now
// nothing would have told either of them that the other had moved. This pins
// the numbers on this side. aledtr77/palette-extractor holds the same file and
// pins its own.
//
// When one of these fails, the question to answer first is whether the number
// was supposed to change. If it was, regenerate the fixture — and copy it to
// the other repo in the same commit, or the two tools go on giving different
// answers under the same name.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as impl from '../src/scripts/pages/tools/palette-extractor/palette-core.js';
import { cases } from '../scripts/colour-contract.mjs';

const fixture = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/colour-contract.json', import.meta.url)), 'utf8'),
);

describe('the colour contract shared with aledtr77/palette-extractor', () => {
  it('has a fixture that still covers every case the generator produces', () => {
    // A case added to the generator and never written to the fixture would be
    // silently untested, which is the failure mode this whole file is about.
    const generated = cases(impl).map(({ fn, args }) => `${fn}(${JSON.stringify(args)})`);
    const recorded = fixture.cases.map(({ fn, args }) => `${fn}(${JSON.stringify(args)})`);
    expect(recorded).toEqual(generated);
  });

  it.each(fixture.cases.map((c, i) => [i, c]))('case %i — %o', (_i, { fn, args, out }) => {
    expect(typeof impl[fn]).toBe('function');
    expect(impl[fn](...args)).toEqual(out);
  });
});
