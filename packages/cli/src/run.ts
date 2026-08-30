import { DEFAULT_THEME, THEME_NAMES } from '@mapre/runtime';
import { buildPresentation } from './build';
import { startDevServer } from './dev';
import { generateChannelPdfs } from './pdf';
import { initPresentation } from './init';

/**
 * Output sinks for the CLI, injectable so command dispatch can be tested
 * without writing to the real stdout/stderr.
 */
export interface CliIo {
  log: (message: string) => void;
  error: (message: string) => void;
}

/**
 * Parsed options for the `build` command.
 */
export interface BuildArgs {
  projectDir: string;
  outFile: string;
  title?: string;
  theme?: string;
  slidesDir?: string;
  styleDir?: string;
  resourcesDir?: string;
  pdf: boolean;
}

/**
 * Parsed options for the `dev` command.
 */
export interface DevArgs extends BuildArgs {
  port: number;
}

/**
 * Parsed options for the `init` command.
 */
export interface InitArgs {
  targetDir: string;
  name?: string;
  theme?: string;
}

const DEFAULT_PROJECT_DIR = '.';
const DEFAULT_OUT_FILE = 'dist/presentation.html';
const DEFAULT_DEV_PORT = 4321;

const DEFAULT_IO: CliIo = {
  log: (message) => process.stdout.write(`${message}\n`),
  error: (message) => process.stderr.write(`${message}\n`),
};

const HELP_TEXT = [
  'mapre — build markdown presentations',
  '',
  'Usage:',
  '  mapre init <dir> [--name <name>]     Scaffold a new presentation folder',
  '  mapre build [projectDir] [options]   Build a single-file HTML presentation',
  '  mapre dev [projectDir] [options]     Build, serve, and rebuild on change',
  '',
  'A project has a default layout: a slides/ folder (markdown), an optional',
  'style/ folder (CSS and HTML templates), and an optional resources/ folder',
  '(images and other assets, copied next to the output and referenced as',
  'resources/<file>). projectDir defaults to the current directory. Each folder',
  'can be pointed elsewhere with --slides, --style and --resources, e.g. to',
  'build several decks that share one style/ and resources/ folder.',
  '',
  'init options:',
  '  --name <name>        Display name for the presentation',
  `  --theme <theme>      Theme to write into the scaffolded deck (default: ${DEFAULT_THEME})`,
  '',
  'build options:',
  '  -o, --out <file>       Output HTML file (default: dist/presentation.html)',
  '  -t, --title <title>    Override the document title',
  '      --theme <theme>  Override the deck theme',
  '  --slides <dir>         Slides folder (default: <projectDir>/slides)',
  '  --style <dir>          Style folder (default: <projectDir>/style)',
  '  --resources <dir>      Resources folder (default: <projectDir>/resources)',
  '  --pdf                  Also render each channel HTML to a PDF (uses Docker if',
  '                         available, else a system Chrome/Edge; HTML is kept)',
  '  A print-to-PDF HTML per channel is written next to the output (e.g.',
  '  presentation-en.html); open one in a browser and use Print -> Save as PDF.',
  '',
  'dev options:',
  '  -o, --out <file>       Output HTML file (default: dist/presentation.html)',
  '  -t, --title <title>    Override the document title',
  '      --theme <theme>  Override the deck theme',
  '  --slides <dir>         Slides folder (default: <projectDir>/slides)',
  '  --style <dir>          Style folder (default: <projectDir>/style)',
  '  --resources <dir>      Resources folder (default: <projectDir>/resources)',
  '  -p, --port <port>      Port to serve on (default: 4321)',
  '',
  `Themes: ${THEME_NAMES.join(', ')}`,
  '',
  'Examples:',
  '  mapre init my-talk --theme light',
  '  mapre build -o dist/presentation.html',
  '  mapre dev -p 4321',
].join('\n');

/**
 * Runs the CLI for the given argument vector (without the node/script prefix)
 * and returns the intended process exit code.
 */
export function run(argv: string[], io: CliIo = DEFAULT_IO): number {
  const [command, ...rest] = argv;

  switch (command) {
    case 'build': {
      const args = parseBuildArgs(rest);
      const result = buildPresentation(args);
      io.log(`Built presentation -> ${result.presentation}`);
      for (const channelFile of result.channelFiles) {
        io.log(`Built print HTML -> ${channelFile}`);
      }
      if (args.pdf) {
        generateChannelPdfs({ htmlFiles: result.channelFiles, reporter: io });
      }
      return 0;
    }
    case 'dev': {
      const args = parseDevArgs(rest);
      // Build once up front so configuration errors fail fast before serving.
      buildPresentation(args);
      const server = startDevServer(args, io);
      server.whenReady.then(({ url }) => {
        io.log(`Dev server -> ${url}`);
        io.log(`Watching ${args.slidesDir ?? `${args.projectDir}/slides`} — edit markdown, then reload the page.`);
      });
      return 0;
    }
    case 'init': {
      const args = parseInitArgs(rest);
      const dir = initPresentation(args);
      io.log(`Created presentation -> ${dir}`);
      io.log("Next: cd into it and run 'mapre build' to produce dist/index.html.");
      return 0;
    }
    case undefined:
    case 'help':
    case '-h':
    case '--help': {
      io.log(HELP_TEXT);
      return 0;
    }
    default: {
      io.error(`Unknown command: ${command}`);
      io.log(HELP_TEXT);
      return 1;
    }
  }
}

/**
 * Parses the arguments of the `build` command.
 */
export function parseBuildArgs(args: string[]): BuildArgs {
  const positionals: string[] = [];
  let outFile = DEFAULT_OUT_FILE;
  let title: string | undefined;
  let theme: string | undefined;
  let slidesDir: string | undefined;
  let styleDir: string | undefined;
  let resourcesDir: string | undefined;
  let pdf = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '-o' || arg === '--out') {
      outFile = requireValue(arg, args[index + 1]);
      index += 1;
    } else if (arg === '-t' || arg === '--title') {
      title = requireValue(arg, args[index + 1]);
      index += 1;
    } else if (arg === '--theme') {
      theme = requireValue(arg, args[index + 1]);
      index += 1;
    } else if (arg === '--slides') {
      slidesDir = requireValue(arg, args[index + 1]);
      index += 1;
    } else if (arg === '--style') {
      styleDir = requireValue(arg, args[index + 1]);
      index += 1;
    } else if (arg === '--resources') {
      resourcesDir = requireValue(arg, args[index + 1]);
      index += 1;
    } else if (arg === '--pdf') {
      pdf = true;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positionals.push(arg);
    }
  }

  return {
    projectDir: positionals[0] ?? DEFAULT_PROJECT_DIR,
    outFile,
    title,
    theme,
    slidesDir,
    styleDir,
    resourcesDir,
    pdf,
  };
}

/**
 * Parses the arguments of the `dev` command: the build options plus a port.
 */
export function parseDevArgs(args: string[]): DevArgs {
  const buildArgs: string[] = [];
  let port = DEFAULT_DEV_PORT;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '-p' || arg === '--port') {
      port = parsePort(requireValue(arg, args[index + 1]));
      index += 1;
    } else {
      buildArgs.push(arg);
    }
  }

  return { ...parseBuildArgs(buildArgs), port };
}

/**
 * Parses a port argument into a valid TCP port number.
 */
function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid port: ${value}`);
  }
  return port;
}

/**
 * Parses the arguments of the `init` command.
 */
export function parseInitArgs(args: string[]): InitArgs {
  const positionals: string[] = [];
  let name: string | undefined;
  let theme: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--name') {
      name = requireValue(arg, args[index + 1]);
      index += 1;
    } else if (arg === '--theme') {
      theme = requireValue(arg, args[index + 1]);
      index += 1;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positionals.push(arg);
    }
  }

  const targetDir = positionals[0];
  if (targetDir === undefined) {
    throw new Error('Missing target directory. Usage: mapre init <dir>');
  }

  return { targetDir, name, theme };
}

function requireValue(flag: string, value: string | undefined): string {
  if (value === undefined || value.startsWith('-')) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}
