import express from "express";
import cors from "cors";
import helmet from "helmet";
import { clerkMiddleware } from "./lib/auth";

import studentRoutes from "./routes/students";
import sessionRoutes from "./routes/sessions";
import paymentRoutes from "./routes/payments";
import eventRoutes from "./routes/events";
import resourceRoutes from "./routes/resources";
import stripeRoutes from "./routes/stripe";
import seedRoutes from "./routes/seed";
import newsletterRoutes from "./routes/newsletter";

const app = express();
const PORT = process.env.PORT || 8080;

// Security headers
app.use(helmet());

// CORS — allow the Vercel frontend origin
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "https://website-sage-three-98.vercel.app",
    credentials: true,
  })
);

// JSON body parser
app.use(express.json());

// Clerk middleware — populates req.auth on all requests
app.use(clerkMiddleware());

// Health check (no auth required)
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "mathitude-backend",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/students", studentRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/seed", seedRoutes);
app.use("/api/newsletter", newsletterRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`Mathitude API running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
