/**
 * Structured console logging for the terminal pipeline.
 *
 * Every router strategy and the gesture engine emits through this module so logs
 * carry a consistent component tag and severity, matching the app's error-first
 * convention (see src/app/api routes). Logs are intentionally kept local; the
 * user-visible transcript lives in the zustand terminal store.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const NAME = 'hey-terminal';

function stamp(level: LogLevel, tag: string, message: string, extra?: unknown): void {
  const time = new Date().toISOString();
  const prefix = `[${time}] ${NAME}:${tag} (${level}) `;
  const payload = extra === undefined ? '' : ` ${safeSerialize(extra)}`;
  const line = prefix + message + payload;

  switch (level) {
    case 'debug':
      console.debug(line);
      break;
    case 'info':
      console.info(line);
      break;
    case 'warn':
      console.warn(line);
      break;
    case 'error':
      console.error(line);
      break;
  }
}

function safeSerialize(value: unknown): string {
  try {
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** Scoped logger bound to a specific component tag. */
export interface Logger {
  debug(message: string, extra?: unknown): void;
  info(message: string, extra?: unknown): void;
  warn(message: string, extra?: unknown): void;
  error(message: string, extra?: unknown): void;
}

export function createLogger(tag: string): Logger {
  return {
    debug: (message, extra) => stamp('debug', tag, message, extra),
    info: (message, extra) => stamp('info', tag, message, extra),
    warn: (message, extra) => stamp('warn', tag, message, extra),
    error: (message, extra) => stamp('error', tag, message, extra),
  };
}

/** Singleton logger for the terminal pipeline core. */
export const terminalLog = createLogger('core');
export const routerLog = createLogger('router');
export const strategyLog = createLogger('strategy');
export const gestureLog = createLogger('gesture');
export const storeLog = createLogger('store');