const buckets = new Map();
const WINDOW_MS = 60_000;
const LIMIT = 30;

export function enforceRateLimit(event) {
  const ip = event.headers?.['x-nf-client-connection-ip']
    ?? event.headers?.['client-ip']
    ?? event.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
    ?? 'local';
  const now = Date.now();
  const bucket = buckets.get(ip) ?? { count: 0, resetAt: now + WINDOW_MS };

  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + WINDOW_MS;
  }

  bucket.count += 1;
  buckets.set(ip, bucket);

  if (bucket.count > LIMIT) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return {
      limited: true,
      retryAfterSeconds,
    };
  }

  return {
    limited: false,
    remaining: Math.max(0, LIMIT - bucket.count),
  };
}
