import type { Request, Response, NextFunction } from "express";

export function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const configuredKey = process.env.API_KEY?.trim();

  if (!configuredKey) {
    if (process.env.NODE_ENV === "production") {
      res.status(503).json({
        error: "API no configurada: define API_KEY en el servidor",
      });
      return;
    }
    next();
    return;
  }

  const provided =
    req.headers["x-api-key"] ??
    req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (typeof provided !== "string" || provided !== configuredKey) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }

  next();
}
