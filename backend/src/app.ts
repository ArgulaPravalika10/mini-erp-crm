import cors from "cors";
import express from "express";
import { errorHandler, notFound } from "./middleware/errorHandler";
import authRoutes from "./routes/authRoutes";
import customerRoutes from "./routes/customerRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import orderRoutes from "./routes/orderRoutes";
import productRoutes from "./routes/productRoutes";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || true,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Mini ERP + CRM Backend is running");
});

app.get("/api/health", (_req, res) => {
  res.json({ service: "mini-erp-crm", status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
