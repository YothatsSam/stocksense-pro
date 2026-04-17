require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false,
})

// Each statement is run separately so IF NOT EXISTS guards work correctly
// on both fresh databases and existing ones that predate multi-tenancy.
const statements = [

  // ── Core tables (safe to run on any state) ──────────────────────────

  `CREATE TABLE IF NOT EXISTS organisations (
    id                SERIAL PRIMARY KEY,
    name              VARCHAR(255) NOT NULL,
    business_type     VARCHAR(50)  NOT NULL CHECK (business_type IN ('retail', 'restaurant', 'distribution')),
    email             VARCHAR(255) NOT NULL UNIQUE,
    subscription_plan VARCHAR(50)  NOT NULL DEFAULT 'starter' CHECK (subscription_plan IN ('starter', 'growth', 'enterprise')),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS locations (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    business_type   VARCHAR(50)  NOT NULL CHECK (business_type IN ('retail', 'restaurant', 'distribution')),
    address         TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS products (
    id          SERIAL PRIMARY KEY,
    sku         VARCHAR(100) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    unit        VARCHAR(50)  NOT NULL DEFAULT 'unit',
    unit_cost   NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS stock_levels (
    id            SERIAL PRIMARY KEY,
    product_id    INT           NOT NULL REFERENCES products(id)  ON DELETE CASCADE,
    location_id   INT           NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    quantity      NUMERIC(12,3) NOT NULL DEFAULT 0,
    reorder_point NUMERIC(12,3) NOT NULL DEFAULT 0,
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, location_id)
  )`,

  `CREATE TABLE IF NOT EXISTS stock_movements (
    id              SERIAL PRIMARY KEY,
    product_id      INT           NOT NULL REFERENCES products(id)  ON DELETE CASCADE,
    location_id     INT           NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    quantity_change NUMERIC(12,3) NOT NULL,
    reason          VARCHAR(255),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS suppliers (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS purchase_orders (
    id          SERIAL PRIMARY KEY,
    supplier_id INT         NOT NULL REFERENCES suppliers(id)  ON DELETE RESTRICT,
    location_id INT         NOT NULL REFERENCES locations(id)  ON DELETE RESTRICT,
    status      VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'received', 'cancelled')),
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    name          VARCHAR(255),
    password_hash TEXT         NOT NULL,
    role          VARCHAR(50)  NOT NULL DEFAULT 'admin',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS recipes (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    location_id INT          NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id                SERIAL PRIMARY KEY,
    recipe_id         INT           NOT NULL REFERENCES recipes(id)  ON DELETE CASCADE,
    product_id        INT           NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_required NUMERIC(12,3) NOT NULL,
    UNIQUE (recipe_id, product_id)
  )`,

  // ── Multi-tenancy: add organisation_id to every table ───────────────
  // ALTER TABLE ... ADD COLUMN IF NOT EXISTS is a no-op when the column
  // already exists, so these are safe to run repeatedly.

  `ALTER TABLE locations
     ADD COLUMN IF NOT EXISTS organisation_id INT REFERENCES organisations(id) ON DELETE CASCADE`,

  `ALTER TABLE products
     ADD COLUMN IF NOT EXISTS organisation_id INT REFERENCES organisations(id) ON DELETE CASCADE`,

  `ALTER TABLE stock_levels
     ADD COLUMN IF NOT EXISTS organisation_id INT REFERENCES organisations(id) ON DELETE CASCADE`,

  `ALTER TABLE stock_movements
     ADD COLUMN IF NOT EXISTS organisation_id INT REFERENCES organisations(id) ON DELETE CASCADE`,

  `ALTER TABLE suppliers
     ADD COLUMN IF NOT EXISTS organisation_id INT REFERENCES organisations(id) ON DELETE CASCADE`,

  `ALTER TABLE purchase_orders
     ADD COLUMN IF NOT EXISTS organisation_id INT REFERENCES organisations(id) ON DELETE CASCADE`,

  `ALTER TABLE users
     ADD COLUMN IF NOT EXISTS organisation_id INT REFERENCES organisations(id) ON DELETE CASCADE`,

  `ALTER TABLE recipes
     ADD COLUMN IF NOT EXISTS organisation_id INT REFERENCES organisations(id) ON DELETE CASCADE`,

  // ── Distribution: purchase_order_items ──────────────────────────────

  `CREATE TABLE IF NOT EXISTS purchase_order_items (
    id                SERIAL PRIMARY KEY,
    purchase_order_id INT           NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id        INT           NOT NULL REFERENCES products(id)        ON DELETE RESTRICT,
    quantity_ordered  NUMERIC(12,3) NOT NULL DEFAULT 0,
    quantity_received NUMERIC(12,3) NOT NULL DEFAULT 0,
    unit_price        NUMERIC(10,2) NOT NULL DEFAULT 0
  )`,

  // ── Distribution: shipments ──────────────────────────────────────────

  `CREATE TABLE IF NOT EXISTS shipments (
    id              SERIAL PRIMARY KEY,
    organisation_id INT         REFERENCES organisations(id) ON DELETE CASCADE,
    reference       VARCHAR(255) NOT NULL,
    type            VARCHAR(20)  NOT NULL DEFAULT 'inbound' CHECK (type IN ('inbound', 'outbound')),
    status          VARCHAR(50)  NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered')),
    location_id     INT         REFERENCES locations(id) ON DELETE SET NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // ── Other additive columns (safe to re-run) ──────────────────────────

  `ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0`,
  `ALTER TABLE users    ADD COLUMN IF NOT EXISTS name VARCHAR(255)`,

  // ── Additive columns on purchase_orders ─────────────────────────────

  `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS total_items      INT          NOT NULL DEFAULT 0`,
  `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS expected_delivery DATE`,

  // ── Additive columns on suppliers ───────────────────────────────────

  `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255)`,
  `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS notes TEXT`,

  // ── User preferences (notification toggles) ─────────────────────────

  `CREATE TABLE IF NOT EXISTS user_preferences (
    id                SERIAL PRIMARY KEY,
    user_id           INT  NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    low_stock_alerts  BOOLEAN NOT NULL DEFAULT TRUE,
    weekly_summary    BOOLEAN NOT NULL DEFAULT TRUE,
    new_user_joined   BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS notification_preferences (
    id                SERIAL PRIMARY KEY,
    user_id           INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organisation_id   INT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    low_stock_alerts  BOOLEAN NOT NULL DEFAULT true,
    weekly_summary    BOOLEAN NOT NULL DEFAULT true,
    new_user_joined   BOOLEAN NOT NULL DEFAULT true,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
  )`,

  `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS products_supplied TEXT NOT NULL DEFAULT ''`,
]

async function migrate() {
  const client = await pool.connect()
  try {
    for (const sql of statements) {
      await client.query(sql)
    }
    console.log(`Migration complete — ran ${statements.length} statements.`)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
