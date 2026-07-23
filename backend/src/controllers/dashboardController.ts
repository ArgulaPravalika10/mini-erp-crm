import pool from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";

interface SalesTrendRow {
  label: string;
  total: string | number;
}

export const getDashboardStats = asyncHandler(async (_req, res) => {
  const [
    customers,
    products,
    orders,
    revenue,
    lowStockProducts,
    recentOrders,
    salesTrend,
    recentActivities,
  ] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM customers"),
    pool.query("SELECT COUNT(*) FROM products"),
    pool.query("SELECT COUNT(*) FROM challans"),
    pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) AS total FROM challans WHERE status = 'Confirmed'",
    ),
    pool.query(
      `SELECT id, name, sku, current_stock, minimum_stock_alert_quantity, location
       FROM products
       WHERE current_stock <= minimum_stock_alert_quantity
       ORDER BY current_stock ASC, name ASC
       LIMIT 8`,
    ),
    pool.query(
      `SELECT ch.id, ch.challan_number, ch.status, ch.total_quantity, ch.total_amount, ch.created_at,
              c.name AS customer_name
       FROM challans ch
       JOIN customers c ON c.id = ch.customer_id
       ORDER BY ch.created_at DESC
       LIMIT 8`,
    ),
    pool.query(
      `SELECT TO_CHAR(month_bucket, 'Mon YYYY') AS label,
              COALESCE(total, 0) AS total
       FROM (
         SELECT date_trunc('month', CURRENT_DATE) - (interval '1 month' * series) AS month_bucket
         FROM generate_series(5, 0, -1) AS series
       ) months
       LEFT JOIN (
         SELECT date_trunc('month', created_at) AS month_bucket,
                SUM(total_amount) AS total
         FROM challans
         WHERE status = 'Confirmed'
         GROUP BY date_trunc('month', created_at)
       ) sales USING (month_bucket)
       ORDER BY month_bucket ASC`,
    ),
    pool.query(
      `SELECT 'Challan' AS type,
              CONCAT(ch.challan_number, ' ', ch.status) AS title,
              ch.created_at
       FROM challans ch
       UNION ALL
       SELECT 'Stock' AS type,
              CONCAT(p.name, ' ', m.movement_type, ' ', m.quantity_changed) AS title,
              m.created_at
       FROM stock_movements m
       JOIN products p ON p.id = m.product_id
       UNION ALL
       SELECT 'Follow-up' AS type,
              CONCAT(c.name, ': ', LEFT(f.note, 80)) AS title,
              f.created_at
       FROM customer_followups f
       JOIN customers c ON c.id = f.customer_id
       ORDER BY created_at DESC
       LIMIT 10`,
    ),
  ]);

  res.json({
    totalCustomers: Number(customers.rows[0].count),
    totalProducts: Number(products.rows[0].count),
    totalOrders: Number(orders.rows[0].count),
    revenue: Number(revenue.rows[0].total),
    lowStockProducts: lowStockProducts.rows,
    recentOrders: recentOrders.rows,
    salesTrend: (salesTrend.rows as unknown as SalesTrendRow[]).map((row) => ({
      label: row.label,
      total: Number(row.total),
    })),
    recentActivities: recentActivities.rows,
  });
});

export const getSalesReport = asyncHandler(async (_req, res) => {
  const result = await pool.query(
    `SELECT ch.id,
            ch.challan_number,
            c.name AS customer_name,
            ch.total_quantity,
            ch.total_amount,
            ch.status,
            ch.created_at
     FROM challans ch
     JOIN customers c ON ch.customer_id = c.id
     ORDER BY ch.created_at DESC`,
  );

  res.json({ data: result.rows });
});
