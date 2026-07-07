import { buildPresentation } from './build';
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
  slidesDir: string;
  outFile: string;
  title?: string;
}

/**
 * Parsed options for the `init` command.
 */
export interface InitArgs {
  targetDir: string;
  name?: string;
}

const DEFAULT_SLIDES_DIR = 'slides';
const DEFAULT_OUT_FILE = 'dist/index.html';

const DEFAULT_IO: CliIo = {
  log: (message) => process.stdout.write(`${message}\n`),
  error: (message) => process.stderr.write(`${message}\n`),
};

const HELP_TEXT = [
  'mapre — build markdown presentations',
  '',
  'Usage:',
  '  mapre init <dir> [--name <name>]     Scaffold a new presentation folder',
  '  mapre build [slidesDir] [options]    Build a single-file HTML presentation',
  '',
  'build options:',
  '  -o, --out <file>     Output HTML file (default: dist/index.html)',
  '  -t, --title <title>  Override the document title',
  '',
  'Examples:',
  '  mapre init my-talk',
  '  mapre build slides -o dist/index.html',
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
    case 'init': {
      const args = parseInitArgs(rest);
      const dir = initPresentation(args);
      io.log(`Created presentation -> ${dir}`);
      io.log("Next: run 'pnpm install', then build with 'mapre build slides'.");
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
    slidesDir: positionals[0] ?? DEFAULT_SLIDES_DIR,
    outFile,
    title,
  };
}

/**
 * Parses the arguments of the `init` command.
 */
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
