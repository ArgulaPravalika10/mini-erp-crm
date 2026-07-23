import pool from "../config/db";
import type { AuthenticatedRequest } from "../types/auth";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import {
  assertOneOf,
  getNonNegativeInteger,
  getNumber,
  getOptionalString,
  getPositiveInteger,
  getString,
  parsePagination,
} from "../utils/validation";

const MOVEMENT_TYPES = ["IN", "OUT"] as const;

export const createProduct = asyncHandler<AuthenticatedRequest>(
  async (req, res) => {
    const name = getString(req.body.name, "Product name");
    const sku = getString(req.body.sku, "SKU/code");
    const category = getOptionalString(req.body.category);
    const unitPrice = getNumber(req.body.unitPrice ?? req.body.price, "Unit price");
    const currentStock = getNonNegativeInteger(
      req.body.currentStock ?? req.body.quantity ?? 0,
      "Current stock",
    );
    const minimumStockAlertQuantity = getNonNegativeInteger(
      req.body.minimumStockAlertQuantity ?? 0,
      "Minimum stock alert quantity",
    );
    const location = getOptionalString(req.body.location);
    const description = getOptionalString(req.body.description);

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `INSERT INTO products
         (name, description, sku, category, price, unit_price, quantity, current_stock, minimum_stock_alert_quantity, location, created_by)
         VALUES ($1, $2, $3, $4, $5, $5, $6, $6, $7, $8, $9)
         RETURNING *`,
        [
          name,
          description,
          sku,
          category,
          unitPrice,
          currentStock,
          minimumStockAlertQuantity,
          location,
          req.user?.id,
        ],
      );

      if (currentStock > 0) {
        await client.query(
          `INSERT INTO stock_movements
           (product_id, quantity_changed, movement_type, reason, reference_type, reference_id, created_by)
           VALUES ($1, $2, 'IN', 'Opening stock', 'product', $1, $3)`,
          [result.rows[0].id, currentStock, req.user?.id],
        );
      }

      await client.query("COMMIT");

      res.status(201).json({
        message: "Product created successfully",
        data: result.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
);

export const getProducts = asyncHandler(async (req, res) => {
  const { limit, offset, page } = parsePagination(req.query);
  const search = String(req.query.search || "").trim();
  const lowStock = String(req.query.lowStock || "") === "true";
  const values: unknown[] = [];
  const where: string[] = [];

  if (search) {
    values.push(`%${search.toLowerCase()}%`);
    where.push(
      `(LOWER(name) LIKE $${values.length}
        OR LOWER(sku) LIKE $${values.length}
        OR LOWER(COALESCE(category, '')) LIKE $${values.length}
        OR LOWER(COALESCE(location, '')) LIKE $${values.length})`,
    );
  }

  if (lowStock) {
    where.push("current_stock <= minimum_stock_alert_quantity");
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM products ${whereSql}`,
    values,
  );

  values.push(limit, offset);
  const result = await pool.query(
    `SELECT *,
            unit_price AS "unitPrice",
            current_stock AS "currentStock",
            minimum_stock_alert_quantity AS "minimumStockAlertQuantity",
            current_stock <= minimum_stock_alert_quantity AS "isLowStock"
     FROM products
     ${whereSql}
     ORDER BY created_at DESC, id DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );

  res.json({
    data: result.rows,
    meta: {
      page,
      limit,
      total: Number(countResult.rows[0].count),
    },
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const product = await pool.query(
    `SELECT *,
            unit_price AS "unitPrice",
            current_stock AS "currentStock",
            minimum_stock_alert_quantity AS "minimumStockAlertQuantity",
            current_stock <= minimum_stock_alert_quantity AS "isLowStock"
     FROM products
     WHERE id = $1`,
    [id],
  );

  if (product.rows.length === 0) {
    throw new AppError(404, "Product not found");
  }

  const movements = await pool.query(
    `SELECT m.*, u.name AS created_by_name
     FROM stock_movements m
     LEFT JOIN users u ON u.id = m.created_by
     WHERE m.product_id = $1
     ORDER BY m.created_at DESC
     LIMIT 50`,
    [id],
  );

  res.json({
    data: {
      ...product.rows[0],
      movements: movements.rows,
    },
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const name = getString(req.body.name, "Product name");
  const sku = getString(req.body.sku, "SKU/code");
  const category = getOptionalString(req.body.category);
  const unitPrice = getNumber(req.body.unitPrice ?? req.body.price, "Unit price");
  const minimumStockAlertQuantity = getNonNegativeInteger(
    req.body.minimumStockAlertQuantity ?? 0,
    "Minimum stock alert quantity",
  );
  const location = getOptionalString(req.body.location);
  const description = getOptionalString(req.body.description);

  const result = await pool.query(
    `UPDATE products
     SET name = $1,
         description = $2,
         sku = $3,
         category = $4,
         price = $5,
         unit_price = $5,
         minimum_stock_alert_quantity = $6,
         location = $7,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $8
     RETURNING *`,
    [
      name,
      description,
      sku,
      category,
      unitPrice,
      minimumStockAlertQuantity,
      location,
      id,
    ],
  );

  if (result.rows.length === 0) {
    throw new AppError(404, "Product not found");
  }

  res.json({
    message: "Product updated successfully",
    data: result.rows[0],
  });
});

export const adjustStock = asyncHandler<AuthenticatedRequest>(
  async (req, res) => {
    const productId = Number(req.params.id);
    const movementType = assertOneOf(
      req.body.movementType,
      MOVEMENT_TYPES,
      "Movement type",
    );
    const quantity = getPositiveInteger(req.body.quantity, "Quantity");
    const reason = getString(req.body.reason, "Reason");

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const product = await client.query(
        `SELECT id, current_stock
         FROM products
         WHERE id = $1
         FOR UPDATE`,
        [productId],
      );

      if (product.rows.length === 0) {
        throw new AppError(404, "Product not found");
      }

      const currentStock = Number(product.rows[0].current_stock);
      const nextStock =
        movementType === "IN" ? currentStock + quantity : currentStock - quantity;

      if (nextStock < 0) {
        throw new AppError(409, "Stock cannot go negative");
      }

      const updated = await client.query(
        `UPDATE products
         SET current_stock = $1,
             quantity = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [nextStock, productId],
      );

      const movement = await client.query(
        `INSERT INTO stock_movements
         (product_id, quantity_changed, movement_type, reason, reference_type, reference_id, created_by)
         VALUES ($1, $2, $3, $4, 'manual_adjustment', $1, $5)
         RETURNING *`,
        [productId, quantity, movementType, reason, req.user?.id],
      );

      await client.query("COMMIT");

      res.json({
        message: "Stock updated successfully",
        data: updated.rows[0],
        movement: movement.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
);

export const getStockMovements = asyncHandler(async (req, res) => {
  const productId = Number(req.params.id);
  const result = await pool.query(
    `SELECT m.*, p.name AS product_name, p.sku, u.name AS created_by_name
     FROM stock_movements m
     JOIN products p ON p.id = m.product_id
     LEFT JOIN users u ON u.id = m.created_by
     WHERE m.product_id = $1
     ORDER BY m.created_at DESC`,
    [productId],
  );

  res.json({ data: result.rows });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const result = await pool.query(
    "DELETE FROM products WHERE id = $1 RETURNING id",
    [Number(req.params.id)],
  );

  if (result.rows.length === 0) {
    throw new AppError(404, "Product not found");
  }

  res.json({ message: "Product deleted successfully" });
});
