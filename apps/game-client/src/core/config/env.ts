import type { LogLevel } from '@core/logger';

/**
 * Typed access to build-time environment (Vite `import.meta.env`).
 *
 * Only non-secret, client-safe configuration belongs here. Per-mode defaults
 * are derived from Vite's `DEV`/`PROD` flags; override via a `.env.*.local`
 * file (see `.env.example`).
 */

const LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error', 'silent'];

export function parseLogLevel(value: string | undefined, fallback: LogLevel): LogLevel {
  if (value !== undefined && (LOG_LEVELS as readonly string[]).includes(value)) {
    return value as LogLevel;
  }
  return fallback;
}

export interface Env {
  readonly mode: string;
  readonly isDev: boolean;
  readonly isProd: boolean;
  readonly logLevel: LogLevel;
}

export function readEnv(): Env {
  const isDev = import.meta.env.DEV;
  const isProd = import.meta.env.PROD;
  return {
    mode: import.meta.env.MODE,
    isDev,
    isProd,
    logLevel: parseLogLevel(import.meta.env.VITE_LOG_LEVEL, isDev ? 'debug' : 'warn'),
  };
}

/** Eagerly-read environment snapshot for convenience. */
export const env: Env = readEnv();
