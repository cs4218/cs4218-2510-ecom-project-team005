import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";

// 1. Load environment variables
dotenv.config();

const app = express();

// 2. Connect DB hanya jika bukan di mode test
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

// 3. Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// 4. Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);

// 5. Root endpoint
app.get("/", (req, res) => {
  res.send("<h1>Welcome to ecommerce app</h1>");
});

// 6. Port config
const PORT = process.env.PORT || 6060;

// 7. Jalankan server hanya jika bukan test
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(
      `Server running on ${process.env.DEV_MODE} mode on ${PORT}`.bgCyan.white
    );
  });
}

// 8. Export app untuk digunakan oleh testing
export default app;
