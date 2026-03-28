import type { Request, Response, NextFunction } from "express";

// Admin emails — in production, this would come from a database or Clerk metadata
const ADMIN_EMAILS = new Set([
  "info@mathitude.com",
  "phamilton@mathitude.com",
  "test@mathitude.com",
  // Add more admin emails here
]);

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // @ts-ignore — Clerk adds auth to the request
  const auth = req.auth;

  if (!auth?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // For now, allow all authenticated users (TODO: check Clerk user metadata for admin role)
  // In production, check: ADMIN_EMAILS.has(auth.sessionClaims?.email)
  next();
}
