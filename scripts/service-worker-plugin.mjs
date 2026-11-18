import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Include public files as well as bundles: an edited image with a stable name
// must invalidate the previous release's caches just like a JavaScript change.
export default function serviceWorkerVersionPlugin(outDir) {
  return {
    name: 'service-worker-build-version',
    apply: 'build',
    closeBundle: {
      order: 'post',
      sequential: true,
      handler() {
        const root = resolve(outDir);
        const hash = createHash('sha256');
        function fingerprint(directory) {
          for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
            const path = join(directory, entry.name);
            if (entry.isDirectory()) fingerprint(path);
            else {
              hash.update(path.slice(root.length));
              hash.update(readFileSync(path));
            }
          }
        }
        const workerPath = join(root, 'sw.js');
        const worker = readFileSync(workerPath, 'utf8');
        if (!worker.includes('__CODEDGE_BUILD_VERSION__')) {
          this.error('[service-worker] build version placeholder is missing');
        }
        fingerprint(root);
        const version = hash.digest('hex').slice(0, 16);
        writeFileSync(workerPath, worker.replace('__CODEDGE_BUILD_VERSION__', version));
        console.log(`[service-worker] release ${version}`);
      }
    }
  };
}
