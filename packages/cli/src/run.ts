import { buildPresentation } from './build';
import { startDevServer } from './dev';
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
}

/**
 * Parsed options for the `dev` command.
 */
export interface DevArgs {
  projectDir: string;
  outFile: string;
  title?: string;
  port: number;
}

/**
 * Parsed options for the `init` command.
 */
export interface InitArgs {
  targetDir: string;
  name?: string;
}

const DEFAULT_PROJECT_DIR = '.';
const DEFAULT_OUT_FILE = 'dist/index.html';
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
  'A project has a fixed layout: a slides/ folder (markdown) and an optional',
  'style/ folder (CSS and HTML templates). projectDir defaults to the current',
  'directory.',
  '',
  'build options:',
  '  -o, --out <file>     Output HTML file (default: dist/index.html)',
  '  -t, --title <title>  Override the document title',
  '',
  'dev options:',
  '  -o, --out <file>     Output HTML file (default: dist/index.html)',
  '  -t, --title <title>  Override the document title',
  '  -p, --port <port>    Port to serve on (default: 4321)',
  '',
  'Examples:',
  '  mapre init my-talk',
  '  mapre build -o dist/index.html',
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
      const outFile = buildPresentation(args);
      io.log(`Built presentation -> ${outFile}`);
      return 0;
    }
    case 'dev': {
      const args = parseDevArgs(rest);
      // Build once up front so configuration errors fail fast before serving.
      buildPresentation(args);
      const server = startDevServer(args, io);
      server.whenReady.then(({ url }) => {
        io.log(`Dev server -> ${url}`);
        io.log(`Watching ${args.projectDir}/slides — edit markdown, then reload the page.`);
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

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '-o' || arg === '--out') {
      outFile = requireValue(arg, args[index + 1]);
      index += 1;
    } else if (arg === '-t' || arg === '--title') {
      title = requireValue(arg, args[index + 1]);
      index += 1;
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
  };
}

/**
 * Parses the arguments of the `dev` command: the build options plus a port.
 */
export function parseDevArgs(args: string[]): DevArgs {
  const positionals: string[] = [];
  let outFile = DEFAULT_OUT_FILE;
  let title: string | undefined;
  let port = DEFAULT_DEV_PORT;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '-o' || arg === '--out') {
      outFile = requireValue(arg, args[index + 1]);
      index += 1;
    } else if (arg === '-t' || arg === '--title') {
      title = requireValue(arg, args[index + 1]);
      index += 1;
    } else if (arg === '-p' || arg === '--port') {
      port = parsePort(requireValue(arg, args[index + 1]));
      index += 1;
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
    port,
  };
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
export function parseInitArgs(args: string[]): InitArgs {
  const positionals: string[] = [];
  let name: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--name') {
      name = requireValue(arg, args[index + 1]);
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

  return { targetDir, name };
}

function requireValue(flag: string, value: string | undefined): string {
  if (value === undefined || value.startsWith('-')) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}
