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

function commandExists(command) {
  return new Promise((resolve) => {
    const lookup = process.platform === 'win32' ? 'where.exe' : 'which';
    const child = spawn(lookup, [command], {
      stdio: ['ignore', 'pipe', 'ignore'],
      shell: false,
      windowsHide: true,
    });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk.toString(); });
    child.on('error', () => resolve(null));
    child.on('close', (code) => {
      if (code !== 0) return resolve(null);
      const first = output.split(/\r?\n/).map((value) => value.trim()).find(Boolean);
      resolve(first || null);
    });
  });
}

async function findExecutable(candidates, options = {}) {
  for (const candidate of candidates) {
    const resolved = await commandExists(candidate);
    if (!resolved) continue;

    // Windows' App Execution Aliases can expose python.exe/python3.exe from
    // WindowsApps. Those are installers/aliases in some environments and can
    // trigger a multi-second Python download instead of running Python.
    if (options.rejectWindowsApps && process.platform === 'win32' && /[\\/]WindowsApps[\\/]/i.test(resolved)) {
      continue;
    }
    return { command: candidate, path: resolved };
  }
  return null;
}

async function detectToolchains() {
  const [python, c, cpp, javac, java] = await Promise.all([
    findExecutable(process.platform === 'win32' ? ['python.exe', 'python3.exe'] : ['python3', 'python'], { rejectWindowsApps: true }),
    findExecutable(process.platform === 'win32' ? ['gcc.exe', 'clang.exe'] : ['gcc', 'clang']),
    findExecutable(process.platform === 'win32' ? ['g++.exe', 'clang++.exe'] : ['g++', 'clang++']),
    findExecutable(process.platform === 'win32' ? ['javac.exe'] : ['javac']),
    findExecutable(process.platform === 'win32' ? ['java.exe'] : ['java']),
  ]);

  return { python, c, cpp, javac, java };
}

async function executeInDirectory(language, dir, sourceFile, toolchains) {
  const env = safeEnvironment();

  if (language === 'python') {
    if (!toolchains.python) return { ok: false, unavailable: true, error: 'Python is not installed on the server. Install Python and restart the server.' };
    return runProcess(toolchains.python.command, [sourceFile], { cwd: dir, env });
  }

  if (language === 'c') {
    if (!toolchains.c) return { ok: false, unavailable: true, error: 'No C compiler was found. Install GCC or Clang and restart the server.' };
    const binary = path.join(dir, process.platform === 'win32' ? 'program.exe' : 'program');
    const compile = await runProcess(toolchains.c.command, [sourceFile, '-O0', '-o', binary], { cwd: dir, env });
    if (!compile.ok) return { ...compile, stage: 'compile' };
    return { ...(await runProcess(binary, [], { cwd: dir, env })), stage: 'run' };
  }

  if (language === 'cpp') {
    if (!toolchains.cpp) return { ok: false, unavailable: true, error: 'No C++ compiler was found. Install G++ or Clang++ and restart the server.' };
    const binary = path.join(dir, process.platform === 'win32' ? 'program.exe' : 'program');
    const compile = await runProcess(toolchains.cpp.command, [sourceFile, '-O0', '-o', binary], { cwd: dir, env });
    if (!compile.ok) return { ...compile, stage: 'compile' };
    return { ...(await runProcess(binary, [], { cwd: dir, env })), stage: 'run' };
  }

  if (language === 'java') {
    if (!toolchains.javac || !toolchains.java) {
      return { ok: false, unavailable: true, error: 'Java compiler/runtime was not found. Install a JDK and restart the server.' };
    }

    // Compile to Java 8 bytecode so the executor also works when its JVM is
    // older than the JDK used to compile the application.
    const compile = await runProcess(toolchains.javac.command, ['-source', JAVA_TARGET_VERSION, '-target', JAVA_TARGET_VERSION, sourceFile], { cwd: dir, env });
    if (!compile.ok) return { ...compile, stage: 'compile' };
    const className = path.basename(sourceFile, '.java');
    return { ...(await runProcess(toolchains.java.command, ['-cp', dir, className], { cwd: dir, env })), stage: 'run' };
  }

  return { ok: false, error: 'Unsupported execution language.', exitCode: null, signal: null, stage: 'setup' };
}

export async function executeSourceCode(code, language, filename = '') {
  if (!ENABLE_CODE_EXECUTION) {
    return { available: false, executed: false, success: false, status: 'disabled', message: 'Code execution is disabled by server configuration.' };
  }

  const toolchains = await detectToolchains();
  const selectedTool = toolchains[language === 'python' ? 'python' : language === 'c' ? 'c' : language === 'cpp' ? 'cpp' : 'java'];
  if (language === 'java' && (!toolchains.javac || !toolchains.java)) {
    return { available: false, executed: false, success: false, status: 'unavailable', message: 'Java compiler/runtime was not found. Install a JDK and restart the server.' };
  }
  if (language !== 'java' && !selectedTool) {
    const names = { python: 'Python', c: 'GCC/Clang', cpp: 'G++/Clang++' };
    return { available: false, executed: false, success: false, status: 'unavailable', message: `${names[language]} is not installed or available on the server.`, stdout: '', stderr: '' };
  }

  const id = crypto.randomUUID();
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `code-analyzer-${id}-`));
  const javaName = javaClassName(code, filename);
  const filenames = { python: 'main.py', c: 'main.c', cpp: 'main.cpp', java: `${javaName}.java` };
  const sourceFile = filenames[language];

  try {
    await fs.writeFile(path.join(dir, sourceFile), code, 'utf8');
    const result = await executeInDirectory(language, dir, sourceFile, toolchains);
    const stdout = truncate(result.stdout || '');
    const stderr = truncate(result.stderr || '');

    if (result.timedOut) {
      return { available: true, executed: true, success: false, status: 'timeout', message: `Execution exceeded the ${EXECUTION_TIMEOUT_MS / 1000}-second limit.`, stdout: stdout.text, stderr: stderr.text, outputTruncated: stdout.truncated || stderr.truncated };
    }
    if (result.unavailable || result.error && !result.stage) {
      return { available: false, executed: false, success: false, status: 'unavailable', message: result.error || 'Required compiler/runtime is unavailable.', stdout: stdout.text, stderr: stderr.text, outputTruncated: stdout.truncated || stderr.truncated };
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
