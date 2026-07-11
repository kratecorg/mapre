import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildPresentation } from './build';
import { startDevServer, type DevServerHandle } from './dev';

const silentReporter = { log: () => {}, error: () => {} };

describe('startDevServer', () => {
  let root: string;
  let slidesDir: string;
  let styleDir: string;
  let outFile: string;
  let handle: DevServerHandle | undefined;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'mapre-dev-'));
    slidesDir = join(root, 'slides');
    styleDir = join(root, 'style');
    outFile = join(root, 'dist', 'index.html');
    mkdirSync(slidesDir, { recursive: true });
    mkdirSync(styleDir, { recursive: true });
  });

  afterEach(async () => {
    if (handle) {
      await handle.close();
      handle = undefined;
    }
    rmSync(root, { recursive: true, force: true });
  });

  it('serves the built presentation and reflects a rebuild on the next request', async () => {
    writeFileSync(join(slidesDir, '01.md'), '---\ntitle: Dev Demo\n---\n\n# First');
    buildPresentation({ projectDir: root, outFile });

    handle = startDevServer({ projectDir: root, outFile, port: 0 }, silentReporter);
    const { url } = await handle.whenReady;

    const first = await (await fetch(url)).text();
    expect(first).toContain('<title>Dev Demo</title>');
    expect(first).toContain('First');

    writeFileSync(join(slidesDir, '01.md'), '---\ntitle: Dev Demo\n---\n\n# Changed');
    buildPresentation({ projectDir: root, outFile });

    const second = await (await fetch(url)).text();
    expect(second).toContain('Changed');
  });

  it('inlines style-folder css and templates into the build', async () => {
    writeFileSync(join(slidesDir, '01.md'), '[template: card]: #\n[title: Hi]: #\n\nBody');
    writeFileSync(join(styleDir, 'theme.css'), '.slide { color: teal; }');
    writeFileSync(join(styleDir, 'card.html'), '<section><h1>{{title}}</h1>{{content}}</section>');
    buildPresentation({ projectDir: root, outFile });

    handle = startDevServer({ projectDir: root, outFile, port: 0 }, silentReporter);
    const { url } = await handle.whenReady;

    const html = await (await fetch(url)).text();
    expect(html).toContain('.slide { color: teal; }');
    expect(html).toContain('{{title}}');
  });

  it('serves a resources file with the matching content type', async () => {
    writeFileSync(join(slidesDir, '01.md'), '# Title');
    const resourcesDir = join(root, 'resources');
    mkdirSync(resourcesDir, { recursive: true });
    writeFileSync(join(resourcesDir, 'photo.jpg'), 'jpeg-bytes');
    buildPresentation({ projectDir: root, outFile });

    handle = startDevServer({ projectDir: root, outFile, port: 0 }, silentReporter);
    const { url } = await handle.whenReady;

    const response = await fetch(new URL('resources/photo.jpg', url));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/jpeg');
    expect(await response.text()).toBe('jpeg-bytes');
  });

  it('returns 404 for a missing resource', async () => {
    writeFileSync(join(slidesDir, '01.md'), '# Title');
    buildPresentation({ projectDir: root, outFile });

    handle = startDevServer({ projectDir: root, outFile, port: 0 }, silentReporter);
    const { url } = await handle.whenReady;

    const response = await fetch(new URL('resources/missing.png', url));
    expect(response.status).toBe(404);
  });

  it('rejects path traversal out of the resources folder', async () => {
    writeFileSync(join(slidesDir, '01.md'), '# Title');
    writeFileSync(join(root, 'secret.txt'), 'top-secret');
    mkdirSync(join(root, 'resources'), { recursive: true });
    buildPresentation({ projectDir: root, outFile });

    handle = startDevServer({ projectDir: root, outFile, port: 0 }, silentReporter);
    const { url } = await handle.whenReady;

    const response = await fetch(`${url}resources/..%2fsecret.txt`);
    expect(response.status).not.toBe(200);
  });
});
