import { clerkMiddleware, getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

export { clerkMiddleware };

// Custom requireAuth that returns 401 JSON instead of redirecting
export function requireAuth() {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = getAuth(req);
    if (!auth?.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  };
}
