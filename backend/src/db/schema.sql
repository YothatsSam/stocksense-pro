-- StockSense Pro — PostgreSQL Schema
-- Run this file once against your database to initialise all tables.

-- ─── Locations ────────────────────────────────────────────────────────────────
-- Represents a physical store, restaurant, or distribution centre.
CREATE TABLE IF NOT EXISTS locations (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  business_type VARCHAR(50)  NOT NULL CHECK (business_type IN ('retail', 'restaurant', 'distribution')),
  address       TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Products ─────────────────────────────────────────────────────────────────
-- A SKU / inventory item.
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  sku         VARCHAR(100) NOT NULL UNIQUE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  unit        VARCHAR(50)  NOT NULL DEFAULT 'unit',  -- e.g. unit, kg, litre, case
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Stock Levels ─────────────────────────────────────────────────────────────
-- Current on-hand quantity of a product at a location.
CREATE TABLE IF NOT EXISTS stock_levels (
  id            SERIAL PRIMARY KEY,
  product_id    INT          NOT NULL REFERENCES products(id)  ON DELETE CASCADE,
  location_id   INT          NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  quantity      NUMERIC(12,3) NOT NULL DEFAULT 0,
  reorder_point NUMERIC(12,3) NOT NULL DEFAULT 0,  -- alert fires when quantity < reorder_point
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, location_id)
);

-- ─── Stock Movements ──────────────────────────────────────────────────────────
-- Immutable audit log of every quantity change.
CREATE TABLE IF NOT EXISTS stock_movements (
  id              SERIAL PRIMARY KEY,
  product_id      INT           NOT NULL REFERENCES products(id)  ON DELETE CASCADE,
  location_id     INT           NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  quantity_change NUMERIC(12,3) NOT NULL,  -- positive = in, negative = out
  reason          VARCHAR(255),            -- e.g. 'manual adjustment', 'sale', 'delivery'
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── Suppliers ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Purchase Orders ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id          SERIAL PRIMARY KEY,
  supplier_id INT         NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  location_id INT         NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  status      VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'received', 'cancelled')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Seed Data (optional — remove in production) ──────────────────────────────
INSERT INTO locations (name, business_type, address) VALUES
  ('City Centre Store',   'retail',       '1 High Street, London'),
  ('Westfield Branch',    'retail',       '12 Westfield Ave, London'),
  ('The Grill Kitchen',   'restaurant',   '5 Food Court, Manchester'),
  ('North DC',            'distribution', 'Unit 7, Industrial Park, Leeds')
ON CONFLICT DO NOTHING;

INSERT INTO products (sku, name, unit) VALUES
  ('SKU-001', 'Organic Whole Milk',    'litre'),
  ('SKU-002', 'Sourdough Bread Loaf',  'unit'),
  ('SKU-003', 'Free Range Eggs (12)',   'case'),
  ('SKU-004', 'Olive Oil 500ml',       'bottle'),
  ('SKU-005', 'Basmati Rice 1kg',      'kg')
ON CONFLICT DO NOTHING;

INSERT INTO stock_levels (product_id, location_id, quantity, reorder_point) VALUES
  (1, 1, 120,  30),
  (2, 1, 45,   20),
  (3, 1, 8,    25),   -- below reorder point
  (1, 2, 200,  50),
  (4, 2, 12,   15),   -- below reorder point
  (1, 3, 60,   20),
  (5, 3, 5,    10),   -- below reorder point
  (2, 4, 500,  100),
  (3, 4, 300,  50),
  (5, 4, 150,  40)
ON CONFLICT DO NOTHING;
