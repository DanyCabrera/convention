import type { Request, Response, NextFunction } from "express";

interface WindowEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, WindowEntry>();

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}) {
  const { windowMs, max, keyPrefix = "" } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
      req.socket.remoteAddress ??
      "unknown";
    const key = `${keyPrefix}${ip}`;
    const now = Date.now();

    let entry = buckets.get(key);
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      buckets.set(key, entry);
    }

    entry.count += 1;

    if (entry.count > max) {
      res.status(429).json({
        error: "Demasiadas solicitudes. Intenta de nuevo en un momento.",
      });
      return;
    }

    next();
  };
}

export const scanRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 30,
  keyPrefix: "scan:",
});
