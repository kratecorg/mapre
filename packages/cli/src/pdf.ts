import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * A resolved way to turn a print HTML file into a PDF. Docker is preferred (a
 * consistent, sandboxed Chromium), a system Chrome/Edge/Chromium is the
 * fallback, and `none` means no renderer is available.
 */
export type PdfRenderer =
  | { kind: 'docker'; image: string }
  | { kind: 'chrome'; executable: string }
  | { kind: 'none' };

/**
 * The default Docker image used to render PDFs. It bundles a headless Chromium
 * (which honours the deck's custom `@page` size, unlike Firefox) together with
 * fonts, and exposes the browser as its entry point. Overridable via the
 * `MAPRE_CHROME_IMAGE` environment variable.
 */
export const DEFAULT_DOCKER_IMAGE = 'zenika/alpine-chrome:latest';

/**
 * Minimal reporter so PDF generation can log progress without depending on the
 * CLI's io type.
 */
export interface PdfReporter {
  log: (message: string) => void;
  error: (message: string) => void;
}

/**
 * The environment probes used to detect a renderer. Injected so the detection
 * order can be unit tested without a real Docker daemon or browser install.
 */
export interface RendererProbe {
  /** Whether a reachable Docker daemon is available. */
  isDockerAvailable: () => boolean;
  /** The Docker image to use when Docker is available. */
  dockerImage: () => string;
  /** The path to a system Chrome/Edge/Chromium, or undefined when none exists. */
  findChromeExecutable: () => string | undefined;
}

/**
 * Picks a PDF renderer, preferring Docker, then a system Chrome/Edge/Chromium,
 * and finally `none`. The assumption is that machines with Node usually also
 * have Docker; a containerised Chromium gives the most consistent output.
 */
export function detectPdfRenderer(probe: RendererProbe): PdfRenderer {
  if (probe.isDockerAvailable()) {
    return { kind: 'docker', image: probe.dockerImage() };
  }

  const executable = probe.findChromeExecutable();
  if (executable !== undefined) {
    return { kind: 'chrome', executable };
  }

  return { kind: 'none' };
}

/**
 * The real environment probe, backed by `docker info`, the `MAPRE_CHROME_IMAGE`
 * variable and a Chrome/Edge/Chromium executable search.
 */
export function createRendererProbe(env: NodeJS.ProcessEnv = process.env): RendererProbe {
  return {
    isDockerAvailable: () => spawnSync('docker', ['info'], { stdio: 'ignore' }).status === 0,
    dockerImage: () => env.MAPRE_CHROME_IMAGE ?? DEFAULT_DOCKER_IMAGE,
    findChromeExecutable: () => findChromeExecutable(env),
  };
}

/**
 * Options for {@link generateChannelPdfs}. The renderer and render function are
 * injectable so the orchestration (which files are produced, that HTML is kept,
 * the no-renderer path) can be unit tested without spawning anything.
 */
export interface GenerateChannelPdfsOptions {
  htmlFiles: string[];
  reporter: PdfReporter;
  renderer?: PdfRenderer;
  render?: (renderer: PdfRenderer, htmlFile: string, pdfFile: string) => void;
}

/**
 * Renders each channel HTML file to a PDF written next to it (same name, `.pdf`
 * extension). The source HTML files are always left in place. When no renderer
 * is available, nothing is produced and the HTML files remain the deliverable.
 * Returns the paths of the PDFs that were written.
 */
export function generateChannelPdfs(options: GenerateChannelPdfsOptions): string[] {
  const { htmlFiles, reporter } = options;
  const renderer = options.renderer ?? detectPdfRenderer(createRendererProbe());
  const render = options.render ?? renderPdf;

  if (renderer.kind === 'none') {
    reporter.log(
      'No Docker or Chrome/Edge/Chromium found — skipping PDF export; the channel HTML files were kept.',
    );
    return [];
  }

  reporter.log(
    renderer.kind === 'docker'
      ? `Rendering PDFs with Docker image ${renderer.image} (first run may pull the image)...`
      : `Rendering PDFs with ${renderer.executable}...`,
  );

  const pdfFiles: string[] = [];
  for (const htmlFile of htmlFiles) {
    const pdfFile = toPdfPath(htmlFile);
    try {
      render(renderer, htmlFile, pdfFile);
      pdfFiles.push(pdfFile);
      reporter.log(`Built PDF -> ${pdfFile}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      reporter.error(`PDF export failed for ${htmlFile}: ${message}. The HTML file was kept.`);
    }
  }

  return pdfFiles;
}

/**
 * Derives the PDF output path for a print HTML file by swapping its `.html`
 * (or `.htm`) extension for `.pdf`.
 */
export function toPdfPath(htmlFile: string): string {
  return htmlFile.replace(/\.html?$/i, '') + '.pdf';
}

/**
 * Renders a single HTML file to PDF using the resolved renderer.
 */
export function renderPdf(renderer: PdfRenderer, htmlFile: string, pdfFile: string): void {
  if (renderer.kind === 'chrome') {
    renderWithChrome(renderer.executable, htmlFile, pdfFile);
    return;
  }
  if (renderer.kind === 'docker') {
    renderWithDocker(renderer.image, htmlFile, pdfFile);
  }
}

const CHROME_PRINT_FLAGS = [
  '--headless',
  '--disable-gpu',
  '--no-pdf-header-footer',
];

const RENDER_TIMEOUT_MS = 120_000;

/**
 * Runs a system Chrome/Edge/Chromium headless to print the HTML file to a PDF.
 * The HTML is loaded as a `file://` URL so images referenced with
 * document-relative paths (e.g. `resources/photo.jpg`) resolve from disk.
 */
function renderWithChrome(executable: string, htmlFile: string, pdfFile: string): void {
  const result = spawnSync(
    executable,
    [...CHROME_PRINT_FLAGS, `--print-to-pdf=${pdfFile}`, pathToFileURL(htmlFile).href],
    { stdio: 'ignore', timeout: RENDER_TIMEOUT_MS },
  );
  assertRenderSucceeded(result, pdfFile);
}

/**
 * Renders the HTML file to PDF inside a Docker container. The file's directory
 * is mounted read-write at `/data`, so both the HTML and its sibling
 * `resources/` folder are visible and the PDF is written back to the host.
 */
function renderWithDocker(image: string, htmlFile: string, pdfFile: string): void {
  const directory = dirnamePosix(htmlFile);
  const htmlName = basename(htmlFile);
  const pdfName = basename(pdfFile);

  const result = spawnSync(
    'docker',
    [
      'run',
      '--rm',
      '-v',
      `${directory}:/data`,
      image,
      '--no-sandbox',
      '--disable-dev-shm-usage',
      ...CHROME_PRINT_FLAGS,
      `--print-to-pdf=/data/${pdfName}`,
      `file:///data/${htmlName}`,
    ],
    { stdio: 'ignore', timeout: RENDER_TIMEOUT_MS },
  );
  assertRenderSucceeded(result, pdfFile);
}

/**
 * Throws a descriptive error when a spawned renderer failed to produce the PDF,
 * covering spawn errors, timeouts, non-zero exit codes and missing output.
 */
function assertRenderSucceeded(
  result: ReturnType<typeof spawnSync>,
  pdfFile: string,
): void {
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`renderer exited with code ${result.status ?? 'unknown'}`);
  }
  if (!existsSync(pdfFile)) {
    throw new Error('renderer produced no output file');
  }
}

/**
 * Finds a system Chrome, Edge or Chromium executable, honouring an explicit
 * override (`MAPRE_CHROME`, falling back to the conventional
 * `PUPPETEER_EXECUTABLE_PATH`) before probing well-known install locations and
 * the `PATH`.
 */
function findChromeExecutable(env: NodeJS.ProcessEnv): string | undefined {
  const explicit = env.MAPRE_CHROME ?? env.PUPPETEER_EXECUTABLE_PATH;
  if (explicit && existsSync(explicit)) {
    return explicit;
  }

  for (const candidate of chromeCandidates(process.platform)) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return findOnPath(process.platform);
}

/**
 * Well-known Chrome/Edge/Chromium install locations per platform.
 */
function chromeCandidates(platform: NodeJS.Platform): string[] {
  if (platform === 'win32') {
    const programFiles = process.env['PROGRAMFILES'] ?? 'C:\\Program Files';
    const programFilesX86 = process.env['PROGRAMFILES(X86)'] ?? 'C:\\Program Files (x86)';
    return [
      `${programFiles}\\Google\\Chrome\\Application\\chrome.exe`,
      `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe`,
      `${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${programFilesX86}\\Microsoft\\Edge\\Application\\msedge.exe`,
    ];
  }
  if (platform === 'darwin') {
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ];
  }
  return [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
  ];
}

/**
 * Looks up a browser executable on the `PATH` using the platform's lookup tool.
 */
function findOnPath(platform: NodeJS.Platform): string | undefined {
  const lookup = platform === 'win32' ? 'where' : 'which';
  const names =
    platform === 'win32'
      ? ['chrome', 'msedge']
      : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge'];

  for (const name of names) {
    const result = spawnSync(lookup, [name], { encoding: 'utf8' });
    if (result.status === 0) {
      const first = result.stdout.split(/\r?\n/)[0]?.trim();
      if (first) {
        return first;
      }
    }
  }

  return undefined;
}

/**
 * Returns the file name of a path, handling both `/` and `\` separators so it
 * works regardless of the host platform.
 */
function basename(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1];
}

/**
 * Returns the directory of a path for use as a Docker bind-mount source. Native
 * absolute paths are used as-is; Docker Desktop translates them to the mount
 * form itself.
 */
function dirnamePosix(filePath: string): string {
  const index = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
  return index <= 0 ? filePath : filePath.slice(0, index);
}
