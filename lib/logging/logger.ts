type LogMeta = Record<string, unknown>;

function sanitizeMeta(meta?: LogMeta): LogMeta | undefined {
  if (!meta) {
    return undefined;
  }

  const sensitive = new Set([
    'password',
    'token',
    'secret',
    'apiKey',
    'service_role',
    'authorization',
  ]);

  const cleaned: LogMeta = {};
  for (const [key, value] of Object.entries(meta)) {
    if (sensitive.has(key.toLowerCase())) {
      cleaned[key] = '[redacted]';
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

function write(level: string, message: string, meta?: LogMeta): void {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...sanitizeMeta(meta),
  };

  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(payload));
    return;
  }

  console[level === 'error' ? 'error' : 'log'](message, sanitizeMeta(meta) ?? '');
}

export const logger = {
  info(message: string, meta?: LogMeta): void {
    write('info', message, meta);
  },
  warn(message: string, meta?: LogMeta): void {
    write('warn', message, meta);
  },
  error(message: string, error?: unknown, meta?: LogMeta): void {
    const errorMeta =
      error instanceof Error
        ? { errorName: error.name, errorMessage: error.message }
        : error
          ? { error: String(error) }
          : {};
    write('error', message, { ...meta, ...errorMeta });
  },
};
