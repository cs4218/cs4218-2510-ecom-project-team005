import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";

// MS3 SECURITY: Import security configuration and middleware
import { helmetConfig, getCorsConfig, getTestCorsConfig } from "./config/security.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";
import { setSecurityHeaders } from "./middlewares/securityHeaders.js";

// 1. Load environment variables
dotenv.config();

const app = express();

// 2. Connect DB (including for E2E tests with MongoDB Memory Server)
// Skip only for unit/integration tests where tests manage DB connection
if (process.env.SKIP_DB_CONNECTION !== "true") {
  connectDB();
}

// 3. MS3 SECURITY: Disable X-Powered-By header at app level
app.disable('x-powered-by');

// 4. MS3 SECURITY: Apply security middlewares BEFORE routes
// Order matters: Helmet → CORS → Security Headers → Routes → Error Handlers

// MS3 SECURITY: Helmet for comprehensive security headers (CSP, X-Frame-Options, etc.)
app.use(helmetConfig);

// MS3 SECURITY: CORS configuration with explicit origin allowlist (no wildcards)
const corsConfig = process.env.NODE_ENV === 'test' ? getTestCorsConfig() : getCorsConfig();
app.use(cors(corsConfig));

// MS3 SECURITY: Explicit security headers as safety net
app.use(setSecurityHeaders);

// 5. Standard middlewares
app.use(express.json());
app.use(morgan("dev"));

// 6. Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);

// 7. Root endpoint
app.get("/", (req, res) => {
  res.send("<h1>Welcome to ecommerce app</h1>");
});

// 8. MS3 SECURITY: Error handling middleware (MUST be after routes)
app.use(notFound);
app.use(errorHandler);

// 9. Port config
const PORT = process.env.PORT || 6060;

// 10. Start server only if not in unit/integration test mode
// E2E tests need the server running (started by webServer in playwright.config.js)
if (process.env.SKIP_SERVER_START !== "true") {
  app.listen(PORT, () => {
    console.log(
      `Server running on ${process.env.DEV_MODE} mode on ${PORT}`.bgCyan.white
    );
  });
}

// 11. Export app for testing
export default app;
