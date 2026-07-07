import { describe, expect, it } from 'vitest';
import { parseBuildArgs, parseInitArgs, run } from './run';
import type { CliIo } from './run';

function captureIo(): { io: CliIo; logs: string[]; errors: string[] } {
  const logs: string[] = [];
  const errors: string[] = [];
  return {
    io: { log: (message) => logs.push(message), error: (message) => errors.push(message) },
    logs,
    errors,
  };
}

describe('parseBuildArgs', () => {
  it('applies defaults when no arguments are given', () => {
    expect(parseBuildArgs([])).toEqual({
      slidesDir: 'slides',
      outFile: 'dist/index.html',
      title: undefined,
    });
  });

  it('reads a positional slides directory and options', () => {
    expect(parseBuildArgs(['content', '-o', 'out/talk.html', '--title', 'Hello'])).toEqual({
      slidesDir: 'content',
      outFile: 'out/talk.html',
      title: 'Hello',
    });
  });

  it('rejects a missing option value', () => {
    expect(() => parseBuildArgs(['-o'])).toThrow(/Missing value for -o/);
  });

  it('rejects unknown options', () => {
    expect(() => parseBuildArgs(['--nope'])).toThrow(/Unknown option/);
  });
});

describe('parseInitArgs', () => {
  it('reads the target directory and an optional name', () => {
    expect(parseInitArgs(['my-talk', '--name', 'My Talk'])).toEqual({
      targetDir: 'my-talk',
      name: 'My Talk',
    });
  });

  it('requires a target directory', () => {
    expect(() => parseInitArgs([])).toThrow(/Missing target directory/);
  });
});

describe('run', () => {
  it('prints help and returns 0 when no command is given', () => {
    const { io, logs } = captureIo();

    expect(run([], io)).toBe(0);
    expect(logs.join('\n')).toContain('Usage:');
  });

  it('reports an unknown command and returns 1', () => {
    const { io, errors } = captureIo();

    expect(run(['frobnicate'], io)).toBe(1);
    expect(errors.join('\n')).toContain('Unknown command: frobnicate');
  });
});
