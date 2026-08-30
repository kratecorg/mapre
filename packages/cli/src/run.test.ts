import { describe, expect, it } from 'vitest';
import { parseBuildArgs, parseDevArgs, parseInitArgs, run } from './run';
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
      projectDir: '.',
      outFile: 'dist/presentation.html',
      title: undefined,
      slidesDir: undefined,
      styleDir: undefined,
      resourcesDir: undefined,
      pdf: false,
    });
  });

  it('reads a positional project directory and options', () => {
    expect(parseBuildArgs(['content', '-o', 'out/talk.html', '--title', 'Hello'])).toEqual({
      projectDir: 'content',
      outFile: 'out/talk.html',
      title: 'Hello',
      slidesDir: undefined,
      styleDir: undefined,
      resourcesDir: undefined,
      pdf: false,
    });
  });

  it('reads per-folder overrides', () => {
    expect(
      parseBuildArgs([
        '--slides',
        'slides/H18',
        '--style',
        'style',
        '--resources',
        'resources',
        '-o',
        'dist/H18/index.html',
      ]),
    ).toEqual({
      projectDir: '.',
      outFile: 'dist/H18/index.html',
      title: undefined,
      slidesDir: 'slides/H18',
      styleDir: 'style',
      resourcesDir: 'resources',
      pdf: false,
    });
  });

  it('sets the pdf flag when --pdf is given', () => {
    expect(parseBuildArgs(['--pdf']).pdf).toBe(true);
  });

  it('reads a theme override', () => {
    expect(parseBuildArgs(['--theme', 'high-contrast']).theme).toBe('high-contrast');
  });

  it('rejects a missing option value', () => {
    expect(() => parseBuildArgs(['-o'])).toThrow(/Missing value for -o/);
  });

  it('rejects unknown options', () => {
    expect(() => parseBuildArgs(['--nope'])).toThrow(/Unknown option/);
  });
});

describe('parseDevArgs', () => {
  it('applies defaults including the dev port', () => {
    expect(parseDevArgs([])).toEqual({
      projectDir: '.',
      outFile: 'dist/presentation.html',
      title: undefined,
      theme: undefined,
      slidesDir: undefined,
      styleDir: undefined,
      resourcesDir: undefined,
      pdf: false,
      port: 4321,
    });
  });

  it('reads a positional project directory and a port', () => {
    expect(parseDevArgs(['content', '-p', '5000'])).toEqual({
      projectDir: 'content',
      outFile: 'dist/presentation.html',
      title: undefined,
      theme: undefined,
      slidesDir: undefined,
      styleDir: undefined,
      resourcesDir: undefined,
      pdf: false,
      port: 5000,
    });
  });

  it('rejects an invalid port', () => {
    expect(() => parseDevArgs(['-p', '99999'])).toThrow(/Invalid port/);
  });

  it('accepts the build options alongside the port', () => {
    expect(parseDevArgs(['-p', '5000', '--theme', 'colorful', '-t', 'Hello'])).toEqual({
      projectDir: '.',
      outFile: 'dist/presentation.html',
      title: 'Hello',
      theme: 'colorful',
      slidesDir: undefined,
      styleDir: undefined,
      resourcesDir: undefined,
      pdf: false,
      port: 5000,
    });
  });

  it('rejects unknown options', () => {
    expect(() => parseDevArgs(['--nope'])).toThrow(/Unknown option/);
  });
});

describe('parseInitArgs', () => {
  it('reads the target directory and an optional name', () => {
    expect(parseInitArgs(['my-talk', '--name', 'My Talk'])).toEqual({
      targetDir: 'my-talk',
      name: 'My Talk',
    });
  });

  it('reads an optional theme', () => {
    expect(parseInitArgs(['my-talk', '--theme', 'light']).theme).toBe('light');
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
