import type { PoolClient } from "pg";
import pool from "../config/db";
import type { AuthenticatedRequest } from "../types/auth";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import {
  assertOneOf,
  getPositiveInteger,
  parsePagination,
} from "../utils/validation";

const CHALLAN_STATUSES = ["Draft", "Confirmed", "Cancelled"] as const;

interface OrderItemInput {
  productId?: unknown;
  product_id?: unknown;
  quantity?: unknown;
}

const generateChallanNumber = async (client: PoolClient): Promise<string> => {
  const sequence = await client.query("SELECT nextval('challan_number_seq') AS id");
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `CH-${today}-${String(sequence.rows[0].id).padStart(5, "0")}`;
};

const hydrateItems = async (
  client: PoolClient,
  items: OrderItemInput[],
  shouldCheckStock: boolean,
) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError(400, "At least one product is required");
  }

  const hydrated = [];

  for (const item of items) {
    const productId = getPositiveInteger(
      item.productId ?? item.product_id,
      "Product",
    );
    const quantity = getPositiveInteger(item.quantity, "Quantity");
    const product = await client.query(
      `SELECT id, name, sku, unit_price, current_stock
       FROM products
       WHERE id = $1
       FOR UPDATE`,
      [productId],
    );

    if (product.rows.length === 0) {
      throw new AppError(404, `Product ${productId} not found`);
    }

    const productRow = product.rows[0];
    const currentStock = Number(productRow.current_stock);

    if (shouldCheckStock && currentStock < quantity) {
      throw new AppError(
        409,
        `Insufficient stock for ${productRow.name}. Available: ${currentStock}`,
      );
    }

    const unitPrice = Number(productRow.unit_price);

    hydrated.push({
      productId,
      productName: productRow.name,
      productSku: productRow.sku,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
    });
  }

  return hydrated;
};

export const createOrder = asyncHandler<AuthenticatedRequest>(
  async (req, res) => {
    const customerId = getPositiveInteger(
      req.body.customerId ?? req.body.customer_id,
      "Customer",
    );
    const status = assertOneOf(
      req.body.status || "Draft",
      CHALLAN_STATUSES,
      "Status",
    );

    if (status === "Cancelled") {
      throw new AppError(400, "New challans can only be Draft or Confirmed");
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const customer = await client.query("SELECT id FROM customers WHERE id = $1", [
        customerId,
      ]);

      if (customer.rows.length === 0) {
        throw new AppError(404, "Customer not found");
      }

      const items = await hydrateItems(client, req.body.items, status === "Confirmed");
      const challanNumber = await generateChallanNumber(client);
      const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
      const totalAmount = items.reduce((total, item) => total + item.lineTotal, 0);

      const challan = await client.query(
        `INSERT INTO challans
         (challan_number, customer_id, total_quantity, total_amount, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [challanNumber, customerId, totalQuantity, totalAmount, status, req.user?.id],
      );

      for (const item of items) {
        await client.query(
          `INSERT INTO challan_items
           (challan_id, product_id, product_name_snapshot, product_sku_snapshot, unit_price_snapshot, quantity, price, line_total)
           VALUES ($1, $2, $3, $4, $5, $6, $5, $7)`,
          [
            challan.rows[0].id,
            item.productId,
            item.productName,
            item.productSku,
            item.unitPrice,
            item.quantity,
            item.lineTotal,
          ],
        );

        if (status === "Confirmed") {
          await client.query(
            `UPDATE products
             SET current_stock = current_stock - $1,
                 quantity = current_stock - $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [item.quantity, item.productId],
          );

          await client.query(
            `INSERT INTO stock_movements
             (product_id, quantity_changed, movement_type, reason, reference_type, reference_id, created_by)
             VALUES ($1, $2, 'OUT', $3, 'challan', $4, $5)`,
            [
              item.productId,
              item.quantity,
              `Confirmed challan ${challanNumber}`,
              challan.rows[0].id,
              req.user?.id,
            ],
          );
        }
      }

      await client.query("COMMIT");

      res.status(201).json({
        message: "Challan created successfully",
        data: challan.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
);

export const getOrders = asyncHandler(async (req, res) => {
  const { limit, offset, page } = parsePagination(req.query);
  const search = String(req.query.search || "").trim();
  const status = String(req.query.status || "").trim();
  const values: unknown[] = [];
  const where: string[] = [];

  if (search) {
    values.push(`%${search.toLowerCase()}%`);
    where.push(
      `(LOWER(ch.challan_number) LIKE $${values.length}
        OR LOWER(c.name) LIKE $${values.length}
        OR LOWER(COALESCE(c.business_name, '')) LIKE $${values.length})`,
    );
  }

  if (status) {
    values.push(status);
    where.push(`ch.status = $${values.length}`);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const countResult = await pool.query(
    `SELECT COUNT(*)
     FROM challans ch
     JOIN customers c ON c.id = ch.customer_id
     ${whereSql}`,
    values,
  );

  values.push(limit, offset);
  const result = await pool.query(
    `SELECT ch.*,
            c.name AS customer_name,
            c.business_name,
            u.name AS created_by_name
     FROM challans ch
     JOIN customers c ON c.id = ch.customer_id
     LEFT JOIN users u ON u.id = ch.created_by
     ${whereSql}
     ORDER BY ch.created_at DESC, ch.id DESC
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

export const getOrderById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const challan = await pool.query(
    `SELECT ch.*,
            c.name AS customer_name,
            c.mobile,
            c.phone,
            c.email,
            c.business_name,
            c.gst_number,
            c.address,
            u.name AS created_by_name
     FROM challans ch
     JOIN customers c ON c.id = ch.customer_id
     LEFT JOIN users u ON u.id = ch.created_by
     WHERE ch.id = $1`,
    [id],
  );

  if (challan.rows.length === 0) {
    throw new AppError(404, "Challan not found");
  }

  const items = await pool.query(
    `SELECT *
     FROM challan_items
     WHERE challan_id = $1
     ORDER BY id ASC`,
    [id],
  );

  res.json({
    data: {
      ...challan.rows[0],
      items: items.rows,
    },
  });
});

export const updateOrderStatus = asyncHandler<AuthenticatedRequest>(
  async (req, res) => {
    const id = Number(req.params.id);
    const status = assertOneOf(req.body.status, CHALLAN_STATUSES, "Status");
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const challan = await client.query(
        `SELECT *
         FROM challans
         WHERE id = $1
         FOR UPDATE`,
        [id],
      );

      if (challan.rows.length === 0) {
        throw new AppError(404, "Challan not found");
      }

      const current = challan.rows[0];

      if (current.status === status) {
        await client.query("COMMIT");
        res.json({ message: "Challan status unchanged", data: current });
        return;
      }

      if (current.status === "Cancelled") {
        throw new AppError(400, "Cancelled challans cannot be changed");
      }

      const items = await client.query(
        `SELECT product_id, product_name_snapshot, quantity
         FROM challan_items
         WHERE challan_id = $1`,
        [id],
      );

      if (current.status === "Draft" && status === "Confirmed") {
        for (const item of items.rows) {
          const product = await client.query(
            `SELECT id, current_stock
             FROM products
             WHERE id = $1
             FOR UPDATE`,
            [item.product_id],
          );
          const stock = Number(product.rows[0]?.current_stock ?? 0);

          if (stock < Number(item.quantity)) {
            throw new AppError(
              409,
              `Insufficient stock for ${item.product_name_snapshot}. Available: ${stock}`,
            );
          }
        }

        for (const item of items.rows) {
          await client.query(
            `UPDATE products
             SET current_stock = current_stock - $1,
                 quantity = current_stock - $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [item.quantity, item.product_id],
          );

          await client.query(
            `INSERT INTO stock_movements
             (product_id, quantity_changed, movement_type, reason, reference_type, reference_id, created_by)
             VALUES ($1, $2, 'OUT', $3, 'challan', $4, $5)`,
            [
              item.product_id,
              item.quantity,
              `Confirmed challan ${current.challan_number}`,
              id,
              req.user?.id,
            ],
          );
        }
      }

      if (current.status === "Confirmed" && status === "Cancelled") {
        for (const item of items.rows) {
          await client.query(
            `UPDATE products
             SET current_stock = current_stock + $1,
                 quantity = current_stock + $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [item.quantity, item.product_id],
          );

          await client.query(
            `INSERT INTO stock_movements
             (product_id, quantity_changed, movement_type, reason, reference_type, reference_id, created_by)
             VALUES ($1, $2, 'IN', $3, 'challan', $4, $5)`,
            [
              item.product_id,
              item.quantity,
              `Cancelled challan ${current.challan_number}`,
              id,
              req.user?.id,
            ],
          );
        }
      }

      const updated = await client.query(
        `UPDATE challans
         SET status = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [status, id],
      );

      await client.query("COMMIT");

      res.json({
        message: "Challan status updated successfully",
        data: updated.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
);

export const deleteOrder = asyncHandler(async (req, res) => {
  const existing = await pool.query("SELECT status FROM challans WHERE id = $1", [
    Number(req.params.id),
  ]);

  if (existing.rows.length === 0) {
    throw new AppError(404, "Challan not found");
  }

  if (existing.rows[0].status === "Confirmed") {
    throw new AppError(409, "Confirmed challans cannot be deleted");
  }

  await pool.query("DELETE FROM challans WHERE id = $1", [Number(req.params.id)]);

  res.json({ message: "Challan deleted successfully" });
});
