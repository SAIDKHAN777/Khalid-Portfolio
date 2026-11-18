type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function formatLog(level: LogLevel, args: unknown[]) {
  const timestamp = new Date().toISOString();
  if (args.length === 1) {
    const first = args[0];
    if (typeof first === 'string') {
      return JSON.stringify({ level, time: timestamp, msg: first });
    }
    return JSON.stringify({ level, time: timestamp, data: first });
  }
  const [meta, msg] = args;
  return JSON.stringify({
    level,
    time: timestamp,
    msg: typeof msg === 'string' ? msg : undefined,
    meta,
  });
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(formatLog('debug', args));
    }
  },
  info: (...args: unknown[]) => {
    console.info(formatLog('info', args));
  },
  warn: (...args: unknown[]) => {
    console.warn(formatLog('warn', args));
  },
  error: (...args: unknown[]) => {
    console.error(formatLog('error', args));
  },
};

export default logger;
