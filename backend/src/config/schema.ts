import pool from "./db";

export const ensureSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(160) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'Sales',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'Sales';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    UPDATE users SET role = 'Sales' WHERE role IS NULL OR role = '';
    UPDATE users SET is_active = true WHERE is_active IS NULL;
    ALTER TABLE users ALTER COLUMN role SET NOT NULL;
    ALTER TABLE users ALTER COLUMN is_active SET NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users (LOWER(email));
    CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(160),
      phone VARCHAR(30),
      mobile VARCHAR(30),
      business_name VARCHAR(180),
      gst_number VARCHAR(40),
      customer_type VARCHAR(30) NOT NULL DEFAULT 'Retail',
      address TEXT,
      status VARCHAR(30) NOT NULL DEFAULT 'Lead',
      follow_up_date DATE,
      notes TEXT,
      created_by INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE customers ADD COLUMN IF NOT EXISTS mobile VARCHAR(30);
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_name VARCHAR(180);
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS gst_number VARCHAR(40);
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type VARCHAR(30) DEFAULT 'Retail';
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Lead';
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS follow_up_date DATE;
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_by INTEGER;
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    UPDATE customers SET mobile = phone WHERE mobile IS NULL AND phone IS NOT NULL;
    UPDATE customers SET customer_type = 'Retail' WHERE customer_type IS NULL OR customer_type = '';
    UPDATE customers SET status = 'Lead' WHERE status IS NULL OR status = '';
    ALTER TABLE customers ALTER COLUMN customer_type SET NOT NULL;
    ALTER TABLE customers ALTER COLUMN status SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (LOWER(name));
    CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers (mobile);
    CREATE INDEX IF NOT EXISTS idx_customers_status ON customers (status);
    CREATE INDEX IF NOT EXISTS idx_customers_follow_up_date ON customers (follow_up_date);

    CREATE TABLE IF NOT EXISTS customer_followups (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      note TEXT NOT NULL,
      follow_up_date DATE,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_customer_followups_customer_id ON customer_followups (customer_id);
    CREATE INDEX IF NOT EXISTS idx_customer_followups_created_at ON customer_followups (created_at DESC);

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(160) NOT NULL,
      description TEXT,
      sku VARCHAR(80),
      category VARCHAR(120),
      price NUMERIC(12, 2) NOT NULL DEFAULT 0,
      unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 0,
      current_stock INTEGER NOT NULL DEFAULT 0,
      minimum_stock_alert_quantity INTEGER NOT NULL DEFAULT 0,
      location VARCHAR(120),
      created_by INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(80);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(120);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12, 2) DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS current_stock INTEGER DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS minimum_stock_alert_quantity INTEGER DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS location VARCHAR(120);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by INTEGER;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    UPDATE products SET sku = CONCAT('SKU-', id) WHERE sku IS NULL OR sku = '';
    UPDATE products SET unit_price = price WHERE unit_price IS NULL OR unit_price = 0;
    UPDATE products SET current_stock = quantity WHERE current_stock IS NULL OR current_stock = 0;
    UPDATE products SET quantity = current_stock WHERE quantity IS NULL;
    UPDATE products SET minimum_stock_alert_quantity = 0 WHERE minimum_stock_alert_quantity IS NULL;
    ALTER TABLE products ALTER COLUMN sku SET NOT NULL;
    ALTER TABLE products ALTER COLUMN unit_price SET NOT NULL;
    ALTER TABLE products ALTER COLUMN current_stock SET NOT NULL;
    ALTER TABLE products ALTER COLUMN minimum_stock_alert_quantity SET NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_unique ON products (LOWER(sku));
    CREATE INDEX IF NOT EXISTS idx_products_name ON products (LOWER(name));
    CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
    CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products (current_stock, minimum_stock_alert_quantity);

    CREATE TABLE IF NOT EXISTS stock_movements (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity_changed INTEGER NOT NULL,
      movement_type VARCHAR(3) NOT NULL,
      reason TEXT NOT NULL,
      reference_type VARCHAR(40),
      reference_id INTEGER,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements (product_id);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements (created_at DESC);

    CREATE TABLE IF NOT EXISTS challans (
      id SERIAL PRIMARY KEY,
      challan_number VARCHAR(40),
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
      total_quantity INTEGER NOT NULL DEFAULT 0,
      total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'Draft',
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE challans ADD COLUMN IF NOT EXISTS challan_number VARCHAR(40);
    ALTER TABLE challans ADD COLUMN IF NOT EXISTS total_quantity INTEGER DEFAULT 0;
    ALTER TABLE challans ADD COLUMN IF NOT EXISTS created_by INTEGER;
    ALTER TABLE challans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    UPDATE challans SET challan_number = CONCAT('CH-LEGACY-', LPAD(id::TEXT, 6, '0')) WHERE challan_number IS NULL OR challan_number = '';
    UPDATE challans SET status = 'Draft' WHERE status IN ('Pending', 'pending') OR status IS NULL OR status = '';
    UPDATE challans SET total_quantity = 0 WHERE total_quantity IS NULL;
    ALTER TABLE challans ALTER COLUMN challan_number SET NOT NULL;
    ALTER TABLE challans ALTER COLUMN total_quantity SET NOT NULL;
    ALTER TABLE challans ALTER COLUMN status SET NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_challans_number_unique ON challans (challan_number);
    CREATE INDEX IF NOT EXISTS idx_challans_customer_id ON challans (customer_id);
    CREATE INDEX IF NOT EXISTS idx_challans_status ON challans (status);
    CREATE INDEX IF NOT EXISTS idx_challans_created_at ON challans (created_at DESC);

    CREATE SEQUENCE IF NOT EXISTS challan_number_seq START 1001;

    CREATE TABLE IF NOT EXISTS challan_items (
      id SERIAL PRIMARY KEY,
      challan_id INTEGER NOT NULL REFERENCES challans(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      product_name_snapshot VARCHAR(160),
      product_sku_snapshot VARCHAR(80),
      unit_price_snapshot NUMERIC(12, 2),
      quantity INTEGER NOT NULL,
      price NUMERIC(12, 2) NOT NULL DEFAULT 0,
      line_total NUMERIC(12, 2) NOT NULL DEFAULT 0
    );

    ALTER TABLE challan_items ADD COLUMN IF NOT EXISTS product_name_snapshot VARCHAR(160);
    ALTER TABLE challan_items ADD COLUMN IF NOT EXISTS product_sku_snapshot VARCHAR(80);
    ALTER TABLE challan_items ADD COLUMN IF NOT EXISTS unit_price_snapshot NUMERIC(12, 2);
    ALTER TABLE challan_items ADD COLUMN IF NOT EXISTS line_total NUMERIC(12, 2) DEFAULT 0;
    UPDATE challan_items SET unit_price_snapshot = price WHERE unit_price_snapshot IS NULL;
    UPDATE challan_items SET line_total = quantity * COALESCE(unit_price_snapshot, price, 0) WHERE line_total IS NULL OR line_total = 0;
    ALTER TABLE challan_items ALTER COLUMN line_total SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_challan_items_challan_id ON challan_items (challan_id);
    CREATE INDEX IF NOT EXISTS idx_challan_items_product_id ON challan_items (product_id);
  `);
};
