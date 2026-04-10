require('dotenv').config()
const { Pool } = require('pg')
const bcrypt = require('bcrypt')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false,
})

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // ── Clear existing seed data (FK-safe order) ──────────────────────
    await client.query('DELETE FROM stock_movements')
    await client.query('DELETE FROM stock_levels')
    await client.query('DELETE FROM recipe_ingredients')
    await client.query('DELETE FROM recipes')
    await client.query('DELETE FROM purchase_orders')
    await client.query('DELETE FROM products')
    await client.query('DELETE FROM locations')
    await client.query('DELETE FROM suppliers')
    await client.query("DELETE FROM users WHERE email != 'admin@stocksense.com'")
    await client.query('DELETE FROM organisations')
    console.log('Cleared existing seed data.')

    // ── Organisations ─────────────────────────────────────────────────
    const { rows: [org1] } = await client.query(`
      INSERT INTO organisations (name, business_type, email, subscription_plan)
      VALUES ('FreshMart Retail Group', 'retail', 'admin@stocksense.com', 'growth')
      RETURNING id
    `)

    const { rows: [org2] } = await client.query(`
      INSERT INTO organisations (name, business_type, email, subscription_plan)
      VALUES ('Bella Vista Restaurants', 'restaurant', 'demo2@stocksense.com', 'starter')
      RETURNING id
    `)
    console.log(`Created organisations: org1=${org1.id}, org2=${org2.id}`)

    // ── Org 1 Locations ───────────────────────────────────────────────
    const { rows: org1Locs } = await client.query(`
      INSERT INTO locations (organisation_id, name, business_type, address) VALUES
        ($1, 'London Flagship',     'retail', '12 Oxford Street, London, W1D 1AB'),
        ($1, 'Manchester Central',  'retail', '45 Market Street, Manchester, M1 1WR'),
        ($1, 'Birmingham Bullring', 'retail', '8 Moor Street, Birmingham, B5 4BE'),
        ($1, 'Leeds City Store',    'retail', '3 Briggate, Leeds, LS1 6HD')
      RETURNING id
    `, [org1.id])
    const [locLon, locMan, locBir, locLee] = org1Locs.map(r => r.id)

    // ── Org 2 Locations ───────────────────────────────────────────────
    const { rows: org2Locs } = await client.query(`
      INSERT INTO locations (organisation_id, name, business_type, address) VALUES
        ($1, 'Bella Vista Soho',      'restaurant', '22 Old Compton St, London, W1D 4TR'),
        ($1, 'Bella Vista Shoreditch','restaurant', '78 Brick Lane, London, E1 6RL')
      RETURNING id
    `, [org2.id])
    const [locBV1, locBV2] = org2Locs.map(r => r.id)
    console.log(`Created 4 + 2 locations.`)

    // ── Org 1 Suppliers ───────────────────────────────────────────────
    await client.query(`
      INSERT INTO suppliers (organisation_id, name, contact_email, contact_phone) VALUES
        ($1, 'FreshDirect Wholesale', 'orders@freshdirect.co.uk', '0161 234 5678'),
        ($1, 'Metro Foods Supply',    'supply@metrofoods.co.uk',  '0207 890 1234')
    `, [org1.id])

    // ── Org 2 Suppliers ───────────────────────────────────────────────
    await client.query(`
      INSERT INTO suppliers (organisation_id, name, contact_email, contact_phone) VALUES
        ($1, 'Italian Imports Ltd', 'ciao@italianfood.co.uk', '0207 111 2222')
    `, [org2.id])
    console.log('Created suppliers.')

    // ── Org 1 Products ────────────────────────────────────────────────
    const { rows: org1Products } = await client.query(`
      INSERT INTO products (organisation_id, sku, name, description, unit, unit_cost) VALUES
        ($1, 'SKU-001', 'Organic Whole Milk 2L',        'Fresh organic whole milk, 2 litre',       'unit',   1.20),
        ($1, 'SKU-002', 'Sourdough Bread Loaf',          'Artisan sourdough, 800g',                 'unit',   2.50),
        ($1, 'SKU-003', 'Free Range Eggs (12)',           'Large free range eggs, dozen',            'case',   3.80),
        ($1, 'SKU-004', 'Extra Virgin Olive Oil 500ml',   'Cold pressed extra virgin olive oil',    'bottle', 4.99),
        ($1, 'SKU-005', 'Basmati Rice 1kg',              'Premium long grain basmati rice',         'kg',     1.85),
        ($1, 'SKU-006', 'Cheddar Cheese 400g',           'Mature English cheddar block',            'unit',   3.20),
        ($1, 'SKU-007', 'Chicken Breast Fillet 1kg',     'British free range chicken breast',       'kg',     7.50),
        ($1, 'SKU-008', 'Pasta Fusilli 500g',            'Durum wheat fusilli pasta',               'unit',   1.10),
        ($1, 'SKU-009', 'Chopped Tomatoes 400g',         'Italian plum tomatoes in juice, tin',     'tin',    0.90),
        ($1, 'SKU-010', 'Orange Juice 1L',               'Freshly squeezed orange juice, chilled',  'unit',   2.20)
      RETURNING id
    `, [org1.id])
    const [p1,p2,p3,p4,p5,p6,p7,p8,p9,p10] = org1Products.map(r => r.id)

    // ── Org 2 Products ────────────────────────────────────────────────
    const { rows: org2Products } = await client.query(`
      INSERT INTO products (organisation_id, sku, name, description, unit, unit_cost) VALUES
        ($1, 'BV-001', 'Chicken Breast kg',  'Free range chicken breast',     'kg',   8.50),
        ($1, 'BV-002', 'Pasta Pappardelle',  'Fresh egg pappardelle pasta',   'unit', 3.20),
        ($1, 'BV-003', 'San Marzano Tins',   'Italian San Marzano tomatoes',  'tin',  2.10),
        ($1, 'BV-004', 'Olive Oil 5L',       'Italian extra virgin, 5 litre', 'unit', 28.00),
        ($1, 'BV-005', 'Parmigiano 1kg',     'Aged Parmigiano Reggiano',      'kg',   18.50)
      RETURNING id
    `, [org2.id])
    const [bv1,bv2,bv3,bv4,bv5] = org2Products.map(r => r.id)
    console.log('Created 10 + 5 products.')

    // ── Org 1 Stock Levels ────────────────────────────────────────────
    // Rows marked LOW have quantity < reorder_point so alerts fire immediately
    const org1Stock = [
      // London
      [p1,  locLon, 150, 40], [p2,  locLon,  18, 25],  // LOW
      [p3,  locLon,  60, 30], [p4,  locLon,  10, 20],  // LOW
      [p5,  locLon, 200, 50], [p6,  locLon,  35, 30],
      [p7,  locLon,  80, 25], [p8,  locLon, 120, 40],
      [p9,  locLon, 300, 60], [p10, locLon,  22, 30],  // LOW
      // Manchester
      [p1,  locMan,  90, 40], [p2,  locMan,  40, 25],
      [p3,  locMan,   8, 30],                           // LOW
      [p4,  locMan,  55, 20], [p5,  locMan, 110, 50],
      [p6,  locMan,  12, 30],                           // LOW
      [p7,  locMan,  60, 25], [p8,  locMan,  75, 40],
      [p9,  locMan, 180, 60], [p10, locMan,  45, 30],
      // Birmingham
      [p1,  locBir, 200, 40], [p2,  locBir,  30, 25],
      [p3,  locBir,  50, 30], [p4,  locBir,  18, 20],
      [p5,  locBir,  15, 50],                           // LOW
      [p6,  locBir,  70, 30], [p7,  locBir,  10, 25],  // LOW
      [p8,  locBir,  90, 40], [p9,  locBir, 250, 60],
      [p10, locBir,  60, 30],
      // Leeds
      [p1,  locLee, 130, 40], [p2,  locLee,  50, 25],
      [p3,  locLee,  25, 30], [p4,  locLee,  40, 20],
      [p5,  locLee, 170, 50], [p6,  locLee,  28, 30],
      [p7,  locLee,  55, 25], [p8,  locLee,   5, 40],  // LOW
      [p9,  locLee, 100, 60], [p10, locLee,  20, 30],  // LOW
    ]

    for (const [productId, locationId, quantity, reorderPoint] of org1Stock) {
      await client.query(
        `INSERT INTO stock_levels (organisation_id, product_id, location_id, quantity, reorder_point)
         VALUES ($1, $2, $3, $4, $5)`,
        [org1.id, productId, locationId, quantity, reorderPoint]
      )
    }
    console.log(`Created ${org1Stock.length} stock level rows for org1.`)

    // ── Org 2 Stock Levels ────────────────────────────────────────────
    const org2Stock = [
      [bv1, locBV1,  4, 10],  // LOW
      [bv2, locBV1, 18, 20],  // LOW
      [bv3, locBV1, 24, 15],
      [bv4, locBV1,  1,  3],  // LOW
      [bv5, locBV1,  6,  5],
      [bv1, locBV2, 12, 10],
      [bv2, locBV2, 30, 20],
      [bv3, locBV2, 40, 15],
      [bv4, locBV2,  2,  3],
      [bv5, locBV2,  3,  5],  // LOW
    ]

    for (const [productId, locationId, quantity, reorderPoint] of org2Stock) {
      await client.query(
        `INSERT INTO stock_levels (organisation_id, product_id, location_id, quantity, reorder_point)
         VALUES ($1, $2, $3, $4, $5)`,
        [org2.id, productId, locationId, quantity, reorderPoint]
      )
    }
    console.log(`Created ${org2Stock.length} stock level rows for org2.`)

    // ── Users ─────────────────────────────────────────────────────────
    // Remove the pre-existing admin@stocksense.com user so we can re-insert
    // it linked to org1 (the DELETE above skipped it to avoid losing access).
    await client.query("DELETE FROM users WHERE email = 'admin@stocksense.com'")

    const hash1 = await bcrypt.hash('admin123', 10)
    await client.query(
      `INSERT INTO users (organisation_id, email, name, password_hash, role)
       VALUES ($1, 'admin@stocksense.com', 'Admin User', $2, 'admin')`,
      [org1.id, hash1]
    )

    const hash2 = await bcrypt.hash('demo456', 10)
    await client.query(
      `INSERT INTO users (organisation_id, email, name, password_hash, role)
       VALUES ($1, 'demo2@stocksense.com', 'Bella Vista Admin', $2, 'admin')`,
      [org2.id, hash2]
    )
    console.log('Created users.')

    await client.query('COMMIT')
    console.log('\nSeed complete.')
    console.log('  Org 1 (retail):      admin@stocksense.com  / admin123')
    console.log('  Org 2 (restaurant):  demo2@stocksense.com  / demo456')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
