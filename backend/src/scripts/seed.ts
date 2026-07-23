import bcrypt from "bcrypt";
import pool from "../config/db";
import { ensureSchema } from "../config/schema";
import type { UserRole } from "../types/auth";

const demoUsers: Array<{
  name: string;
  email: string;
  role: UserRole;
}> = [
  { name: "Admin User", email: "admin@minierp.test", role: "Admin" },
  { name: "Sales User", email: "sales@minierp.test", role: "Sales" },
  { name: "Warehouse User", email: "warehouse@minierp.test", role: "Warehouse" },
  { name: "Accounts User", email: "accounts@minierp.test", role: "Accounts" },
];

const seed = async () => {
  await ensureSchema();

  const password = await bcrypt.hash("Password@123", 10);

  for (const user of demoUsers) {
    await pool.query(
      `INSERT INTO users (name, email, password, role, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (email)
       DO UPDATE SET
         name = EXCLUDED.name,
         password = EXCLUDED.password,
         role = EXCLUDED.role,
         is_active = true,
         updated_at = CURRENT_TIMESTAMP`,
      [user.name, user.email, password, user.role],
    );
  }

  console.log("Seed complete. Demo password: Password@123");
};

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
