import { Request, Response } from "express";
import pool from "../config/db";

export const addProduct = async (req: Request, res: Response) => {
  console.log("addProduct function reached");

  try {
    const { name, description, price, quantity } = req.body;

    await pool.query(
      `INSERT INTO products (name, description, price, quantity)
   VALUES ($1, $2, $3, $4)`,
      [name, description, price, quantity],
    );
    return res.status(201).json({
      message: "Product added successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};
export const getProducts = async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id ASC");

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, quantity } = req.body;

    await pool.query(
      `UPDATE products
       SET name = $1,
           description = $2,
           price = $3,
           quantity = $4
       WHERE id = $5`,
      [name, description, price, quantity, id],
    );

    return res.status(200).json({
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM products WHERE id = $1", [id]);

    return res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};
