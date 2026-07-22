import { Request, Response } from "express";
import pool from "../config/db";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const customers = await pool.query("SELECT COUNT(*) FROM customers");

    const products = await pool.query("SELECT COUNT(*) FROM products");

    const orders = await pool.query("SELECT COUNT(*) FROM orders");

    const sales = await pool.query(
      "SELECT COALESCE(SUM(total_amount),0) FROM orders",
    );

    return res.status(200).json({
      totalCustomers: Number(customers.rows[0].count),
      totalProducts: Number(products.rows[0].count),
      totalOrders: Number(orders.rows[0].count),
      totalSales: Number(sales.rows[0].coalesce),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};
export const getSalesReport = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT
        orders.id AS order_id,
        customers.name AS customer_name,
        products.name AS product_name,
        orders.total_amount,
        orders.status,
        orders.order_date
       FROM orders
       JOIN customers
       ON orders.customer_id = customers.id
       JOIN products
       ON orders.product_id = products.id
       ORDER BY orders.id ASC`,
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};
