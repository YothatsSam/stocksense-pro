require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const sql = `
-- Locations
CREATE TABLE IF NOT EXISTS locations (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  business_type VARCHAR(50)  NOT NULL CHECK (business_type IN ('retail', 'restaurant', 'distribution')),
  address       TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  sku         VARCHAR(100) NOT NULL UNIQUE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  unit        VARCHAR(50)  NOT NULL DEFAULT 'unit',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Stock Levels
CREATE TABLE IF NOT EXISTS stock_levels (
  id            SERIAL PRIMARY KEY,
  product_id    INT           NOT NULL REFERENCES products(id)  ON DELETE CASCADE,
  location_id   INT           NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  quantity      NUMERIC(12,3) NOT NULL DEFAULT 0,
  reorder_point NUMERIC(12,3) NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, location_id)
);

-- Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id              SERIAL PRIMARY KEY,
  product_id      INT           NOT NULL REFERENCES products(id)  ON DELETE CASCADE,
  location_id     INT           NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  quantity_change NUMERIC(12,3) NOT NULL,
  reason          VARCHAR(255),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id          SERIAL PRIMARY KEY,
  supplier_id INT         NOT NULL REFERENCES suppliers(id)  ON DELETE RESTRICT,
  location_id INT         NOT NULL REFERENCES locations(id)  ON DELETE RESTRICT,
  status      VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'received', 'cancelled')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query(sql)
    console.log('Migration complete — all tables created (or already exist).')
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
