import pool from "../config/db";
import type { AuthenticatedRequest } from "../types/auth";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import {
  assertOneOf,
  getDateOrNull,
  getOptionalString,
  getString,
  parsePagination,
} from "../utils/validation";

const CUSTOMER_TYPES = ["Retail", "Wholesale", "Distributor"] as const;
const CUSTOMER_STATUSES = ["Lead", "Active", "Inactive"] as const;

export const createCustomer = asyncHandler<AuthenticatedRequest>(
  async (req, res) => {
    const name = getString(req.body.name, "Customer name");
    const mobile = getString(
      req.body.mobile ?? req.body.phone,
      "Mobile number",
    );
    const email = getOptionalString(req.body.email);
    const businessName = getOptionalString(req.body.businessName);
    const gstNumber = getOptionalString(req.body.gstNumber);
    const customerType = assertOneOf(
      req.body.customerType || "Retail",
      CUSTOMER_TYPES,
      "Customer type",
    );
    const address = getOptionalString(req.body.address);
    const status = assertOneOf(
      req.body.status || "Lead",
      CUSTOMER_STATUSES,
      "Status",
    );
    const followUpDate = getDateOrNull(req.body.followUpDate, "Follow-up date");
    const notes = getOptionalString(req.body.notes);

    const result = await pool.query(
      `INSERT INTO customers
       (name, email, phone, mobile, business_name, gst_number, customer_type, address, status, follow_up_date, notes, created_by)
       VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        name,
        email,
        mobile,
        businessName,
        gstNumber,
        customerType,
        address,
        status,
        followUpDate,
        notes,
        req.user?.id,
      ],
    );

    if (notes) {
      await pool.query(
        `INSERT INTO customer_followups (customer_id, note, follow_up_date, created_by)
         VALUES ($1, $2, $3, $4)`,
        [result.rows[0].id, notes, followUpDate, req.user?.id],
      );
    }

    res.status(201).json({
      message: "Customer created successfully",
      data: result.rows[0],
    });
  },
);

export const getCustomers = asyncHandler(async (req, res) => {
  const { limit, offset, page } = parsePagination(req.query);
  const search = String(req.query.search || "").trim();
  const status = String(req.query.status || "").trim();
  const values: unknown[] = [];
  const where: string[] = [];

  if (search) {
    values.push(`%${search.toLowerCase()}%`);
    where.push(
      `(LOWER(c.name) LIKE $${values.length}
        OR LOWER(COALESCE(c.email, '')) LIKE $${values.length}
        OR LOWER(COALESCE(c.mobile, c.phone, '')) LIKE $${values.length}
        OR LOWER(COALESCE(c.business_name, '')) LIKE $${values.length}
        OR LOWER(COALESCE(c.gst_number, '')) LIKE $${values.length})`,
    );
  }

  if (status) {
    values.push(status);
    where.push(`c.status = $${values.length}`);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM customers c ${whereSql}`,
    values,
  );

  values.push(limit, offset);
  const result = await pool.query(
    `SELECT c.*,
            COALESCE(c.mobile, c.phone) AS mobile,
            latest.note AS latest_note,
            latest.created_at AS latest_note_at
     FROM customers c
     LEFT JOIN LATERAL (
       SELECT note, created_at
       FROM customer_followups
       WHERE customer_id = c.id
       ORDER BY created_at DESC
       LIMIT 1
     ) latest ON true
     ${whereSql}
     ORDER BY c.created_at DESC, c.id DESC
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

export const getCustomerById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const result = await pool.query(
    `SELECT *, COALESCE(mobile, phone) AS mobile
     FROM customers
     WHERE id = $1`,
    [id],
  );

  if (result.rows.length === 0) {
    throw new AppError(404, "Customer not found");
  }

  const notes = await pool.query(
    `SELECT f.id, f.note, f.follow_up_date, f.created_at, u.name AS created_by_name
     FROM customer_followups f
     LEFT JOIN users u ON u.id = f.created_by
     WHERE f.customer_id = $1
     ORDER BY f.created_at DESC`,
    [id],
  );

  res.json({
    data: {
      ...result.rows[0],
      followUps: notes.rows,
    },
  });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const name = getString(req.body.name, "Customer name");
  const mobile = getString(req.body.mobile ?? req.body.phone, "Mobile number");
  const email = getOptionalString(req.body.email);
  const businessName = getOptionalString(req.body.businessName);
  const gstNumber = getOptionalString(req.body.gstNumber);
  const customerType = assertOneOf(
    req.body.customerType || "Retail",
    CUSTOMER_TYPES,
    "Customer type",
  );
  const address = getOptionalString(req.body.address);
  const status = assertOneOf(
    req.body.status || "Lead",
    CUSTOMER_STATUSES,
    "Status",
  );
  const followUpDate = getDateOrNull(req.body.followUpDate, "Follow-up date");
  const notes = getOptionalString(req.body.notes);

  const result = await pool.query(
    `UPDATE customers
     SET name = $1,
         email = $2,
         phone = $3,
         mobile = $3,
         business_name = $4,
         gst_number = $5,
         customer_type = $6,
         address = $7,
         status = $8,
         follow_up_date = $9,
         notes = $10,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $11
     RETURNING *`,
    [
      name,
      email,
      mobile,
      businessName,
      gstNumber,
      customerType,
      address,
      status,
      followUpDate,
      notes,
      id,
    ],
  );

  if (result.rows.length === 0) {
    throw new AppError(404, "Customer not found");
  }

  res.json({
    message: "Customer updated successfully",
    data: result.rows[0],
  });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const result = await pool.query(
    "DELETE FROM customers WHERE id = $1 RETURNING id",
    [Number(req.params.id)],
  );

  if (result.rows.length === 0) {
    throw new AppError(404, "Customer not found");
  }

  res.json({ message: "Customer deleted successfully" });
});

export const addCustomerFollowUp = asyncHandler<AuthenticatedRequest>(
  async (req, res) => {
    const customerId = Number(req.params.id);
    const note = getString(req.body.note, "Follow-up note");
    const followUpDate = getDateOrNull(req.body.followUpDate, "Follow-up date");

    const customer = await pool.query(
      "SELECT id FROM customers WHERE id = $1",
      [customerId],
    );

    if (customer.rows.length === 0) {
      throw new AppError(404, "Customer not found");
    }

    const result = await pool.query(
      `INSERT INTO customer_followups (customer_id, note, follow_up_date, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [customerId, note, followUpDate, req.user?.id],
    );

    await pool.query(
      `UPDATE customers
       SET follow_up_date = COALESCE($1, follow_up_date),
           notes = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [followUpDate, note, customerId],
    );

    res.status(201).json({
      message: "Follow-up note added successfully",
      data: result.rows[0],
    });
  },
);
