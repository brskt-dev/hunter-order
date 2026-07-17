/**
 * Small, dependency-free leveled logger.
 *
 * - Scoped: each logger carries a scope prefix; `child()` nests scopes.
 * - Level-gated: messages below the configured level are dropped.
 * - Injectable sink: defaults to `console`, overridable for tests.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

export interface LogSink {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

export interface Logger {
  readonly scope: string;
  readonly level: LogLevel;
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  /** Create a nested logger whose scope is `parent:childScope`. */
  child(scope: string): Logger;
}

export interface LoggerOptions {
  level?: LogLevel;
  sink?: LogSink;
}

class ScopedLogger implements Logger {
  constructor(
    readonly scope: string,
    readonly level: LogLevel,
    private readonly sink: LogSink,
  ) {}

  private enabled(level: LogLevel): boolean {
    return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[this.level];
  }

  private get prefix(): string {
    return `[${this.scope}]`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.enabled('debug')) {
      this.sink.debug(this.prefix, message, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.enabled('info')) {
      this.sink.info(this.prefix, message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.enabled('warn')) {
      this.sink.warn(this.prefix, message, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.enabled('error')) {
      this.sink.error(this.prefix, message, ...args);
    }
  }

  child(scope: string): Logger {
    return new ScopedLogger(`${this.scope}:${scope}`, this.level, this.sink);
  }
}

export function createLogger(scope: string, options: LoggerOptions = {}): Logger {
  const { level = 'info', sink = console } = options;
  return new ScopedLogger(scope, level, sink);
}
