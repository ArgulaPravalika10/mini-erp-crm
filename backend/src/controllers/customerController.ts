import { Request, Response } from "express";
import pool from "../config/db";

export const addCustomer = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address } = req.body;

    await pool.query(
      `INSERT INTO customers (name, email, phone, address)
       VALUES ($1, $2, $3, $4)`,
      [name, email, phone, address],
    );

    return res.status(201).json({
      message: "Customer added successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};
export const getCustomers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM customers ORDER BY id ASC");

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};
export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    await pool.query(
      `UPDATE customers
       SET name = $1,
           email = $2,
           phone = $3,
           address = $4
       WHERE id = $5`,
      [name, email, phone, address, id],
    );

    return res.status(200).json({
      message: "Customer updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};
export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    console.log("deleteCustomer called");
    const { id } = req.params;

    await pool.query("DELETE FROM customers WHERE id = $1", [id]);

    return res.status(200).json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};
