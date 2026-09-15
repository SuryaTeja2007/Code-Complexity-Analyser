import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

const EXECUTION_TIMEOUT_MS = Number(process.env.CODE_EXECUTION_TIMEOUT_MS || 5000);
const MAX_OUTPUT_LENGTH = Number(process.env.CODE_EXECUTION_MAX_OUTPUT || 12000);
const ENABLE_CODE_EXECUTION = process.env.ENABLE_CODE_EXECUTION !== 'false';
const JAVA_TARGET_VERSION = process.env.JAVA_TARGET_VERSION || '8';

function truncate(value) {
  if (value.length <= MAX_OUTPUT_LENGTH) return { text: value, truncated: false };
  return { text: `${value.slice(0, MAX_OUTPUT_LENGTH)}\n[Output truncated]`, truncated: true };
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, EXECUTION_TIMEOUT_MS);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      if (stdout.length > MAX_OUTPUT_LENGTH * 2) child.kill('SIGKILL');
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > MAX_OUTPUT_LENGTH * 2) child.kill('SIGKILL');
    });
    child.on('error', (error) => finish({ ok: false, error: error.message, exitCode: null, signal: null, timedOut }));
    child.on('close', (exitCode, signal) => finish({ ok: exitCode === 0 && !timedOut, error: null, exitCode, signal, timedOut, stdout, stderr }));
  });
}

function safeEnvironment() {
  return {
    PATH: process.env.PATH || '',
    HOME: os.tmpdir(),
    LANG: 'C.UTF-8',
    LC_ALL: 'C.UTF-8',
  };
}

function javaClassName(code, filename) {
  const fromFilename = filename && /^[A-Za-z_$][\w$]*\.java$/i.test(filename)
    ? path.basename(filename, '.java')
    : null;
  const fromPublicClass = code.match(/\bpublic\s+(?:final\s+|abstract\s+)?class\s+([A-Za-z_$][\w$]*)/)?.[1];
  const fromClass = code.match(/\bclass\s+([A-Za-z_$][\w$]*)/)?.[1];
  return fromFilename || fromPublicClass || fromClass || 'Main';
}

async function executeInDirectory(language, dir, sourceFile) {
  const env = safeEnvironment();
  if (language === 'python') {
    return runProcess(process.platform === 'win32' ? 'python' : 'python3', [sourceFile], { cwd: dir, env });
  }

  if (language === 'c') {
    const binary = path.join(dir, process.platform === 'win32' ? 'program.exe' : 'program');
    const compile = await runProcess('gcc', [sourceFile, '-O0', '-o', binary], { cwd: dir, env });
    if (!compile.ok) return { ...compile, stage: 'compile' };
    return { ...(await runProcess(binary, [], { cwd: dir, env })), stage: 'run' };
  }

  if (language === 'cpp') {
    const binary = path.join(dir, process.platform === 'win32' ? 'program.exe' : 'program');
    const compile = await runProcess('g++', [sourceFile, '-O0', '-o', binary], { cwd: dir, env });
    if (!compile.ok) return { ...compile, stage: 'compile' };
    return { ...(await runProcess(binary, [], { cwd: dir, env })), stage: 'run' };
  }

  if (language === 'java') {
    // Compile to a class-file version compatible with the Java runtime used by
    // the executor. This prevents javac/JVM mismatches such as class version
    // 69 being run by a JVM that supports only up to class version 52.
    const compile = await runProcess('javac', ['-source', JAVA_TARGET_VERSION, '-target', JAVA_TARGET_VERSION, sourceFile], { cwd: dir, env });
    if (!compile.ok) return { ...compile, stage: 'compile' };
    const className = path.basename(sourceFile, '.java');
    return { ...(await runProcess('java', ['-cp', dir, className], { cwd: dir, env })), stage: 'run' };
  }

  return { ok: false, error: 'Unsupported execution language.', exitCode: null, signal: null, stage: 'setup' };
}

export async function executeSourceCode(code, language, filename = '') {
  if (!ENABLE_CODE_EXECUTION) {
    return { available: false, executed: false, success: false, status: 'disabled', message: 'Code execution is disabled by server configuration.' };
  }

  const id = crypto.randomUUID();
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `code-analyzer-${id}-`));
  const javaName = javaClassName(code, filename);
  const filenames = { python: 'main.py', c: 'main.c', cpp: 'main.cpp', java: `${javaName}.java` };
  const sourceFile = filenames[language];

  try {
    await fs.writeFile(path.join(dir, sourceFile), code, 'utf8');
    const result = await executeInDirectory(language, dir, sourceFile);
    const stdout = truncate(result.stdout || '');
    const stderr = truncate(result.stderr || '');

    if (result.timedOut) {
      return { available: true, executed: true, success: false, status: 'timeout', message: `Execution exceeded the ${EXECUTION_TIMEOUT_MS / 1000}-second limit.`, stdout: stdout.text, stderr: stderr.text, outputTruncated: stdout.truncated || stderr.truncated };
    }
    if (result.error) {
      return { available: false, executed: false, success: false, status: 'unavailable', message: result.error, stdout: stdout.text, stderr: stderr.text, outputTruncated: stdout.truncated || stderr.truncated };
    }
    if (result.stage === 'compile' && !result.ok) {
      return { available: true, executed: false, success: false, status: 'compile_error', message: 'The source could not be compiled, so no program output was produced.', stdout: stdout.text, stderr: stderr.text, outputTruncated: stdout.truncated || stderr.truncated };
    }
    return {
      available: true,
      executed: true,
      success: result.ok,
      status: result.ok ? 'success' : 'runtime_error',
      message: result.ok ? 'Program executed successfully.' : 'The program exited with an error.',
      stdout: stdout.text,
      stderr: stderr.text,
      exitCode: result.exitCode,
      signal: result.signal,
      outputTruncated: stdout.truncated || stderr.truncated,
    };
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

export const executionInfo = {
  enabled: ENABLE_CODE_EXECUTION,
  timeoutMs: EXECUTION_TIMEOUT_MS,
  maxOutputLength: MAX_OUTPUT_LENGTH,
  javaTargetVersion: JAVA_TARGET_VERSION,
};
