import { Request, Response } from "express";
import pool from "../config/db";

export const addOrder = async (req: Request, res: Response) => {
  try {
    const { customer_id, product_id, quantity, total_amount } = req.body;

    await pool.query(
      `INSERT INTO orders
       (customer_id, product_id, quantity, total_amount)
       VALUES ($1, $2, $3, $4)`,
      [customer_id, product_id, quantity, total_amount],
    );

    return res.status(201).json({
      message: "Order created successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};
export const getOrders = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        orders.id,
        customers.name AS customer_name,
        products.name AS product_name,
        orders.quantity,
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
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query(
      `UPDATE orders
       SET status = $1
       WHERE id = $2`,
      [status, id],
    );

    return res.status(200).json({
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM orders WHERE id = $1", [id]);

    return res.status(200).json({
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};
