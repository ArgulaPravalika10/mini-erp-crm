import app from "./app";
import pool from "./config/db";
import { ensureSchema } from "./config/schema";

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    await pool.query("SELECT NOW()");
    await ensureSchema();
    console.log("PostgreSQL connected and schema verified");

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

startServer();
