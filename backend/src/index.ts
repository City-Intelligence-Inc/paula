import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth";
import studentRoutes from "./routes/students";
import familyRoutes from "./routes/families";
import sessionRoutes from "./routes/sessions";
import notesRoutes from "./routes/notes";
import billingRoutes from "./routes/billing";
import dashboardRoutes from "./routes/dashboard";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "mathitude-backend", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/families", familyRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api", notesRoutes); // Mounted at /api so paths become /api/sessions/:id/notes and /api/notes/:id
app.use("/api/billing", billingRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Mathitude API running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;
