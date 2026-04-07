require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Locations
    const { rows: locations } = await client.query(`
      INSERT INTO locations (name, business_type, address) VALUES
        ('London Flagship',      'retail',       '12 Oxford Street, London, W1D 1AB'),
        ('Manchester Central',   'retail',       '45 Market Street, Manchester, M1 1WR'),
        ('Birmingham Bullring',  'retail',       '8 Moor Street, Birmingham, B5 4BE'),
        ('Leeds City Store',     'retail',       '3 Briggate, Leeds, LS1 6HD')
      ON CONFLICT DO NOTHING
      RETURNING id, name
    `)
    console.log(`Inserted ${locations.length} locations`)

    // Re-fetch all locations (in case some already existed)
    const { rows: allLocations } = await client.query(
      `SELECT id FROM locations WHERE name IN
        ('London Flagship','Manchester Central','Birmingham Bullring','Leeds City Store')
       ORDER BY id`
    )
    const [locLon, locMan, locBir, locLee] = allLocations.map(r => r.id)

    // Suppliers
    const { rows: suppliers } = await client.query(`
      INSERT INTO suppliers (name, contact_email, contact_phone) VALUES
        ('FreshDirect Wholesale',  'orders@freshdirect.co.uk',  '0161 234 5678'),
        ('Metro Foods Supply',     'supply@metrofoods.co.uk',   '0207 890 1234')
      ON CONFLICT DO NOTHING
      RETURNING id, name
    `)
    console.log(`Inserted ${suppliers.length} suppliers`)

    // Products
    const { rows: products } = await client.query(`
      INSERT INTO products (sku, name, description, unit) VALUES
        ('SKU-001', 'Organic Whole Milk 2L',      'Fresh organic whole milk, 2 litre',          'unit'),
        ('SKU-002', 'Sourdough Bread Loaf',        'Artisan sourdough, 800g',                    'unit'),
        ('SKU-003', 'Free Range Eggs (12)',         'Large free range eggs, dozen',               'case'),
        ('SKU-004', 'Extra Virgin Olive Oil 500ml', 'Cold pressed extra virgin olive oil',       'bottle'),
        ('SKU-005', 'Basmati Rice 1kg',            'Premium long grain basmati rice',            'kg'),
        ('SKU-006', 'Cheddar Cheese 400g',         'Mature English cheddar block',               'unit'),
        ('SKU-007', 'Chicken Breast Fillet 1kg',   'British free range chicken breast',          'kg'),
        ('SKU-008', 'Pasta Fusilli 500g',          'Durum wheat fusilli pasta',                  'unit'),
        ('SKU-009', 'Chopped Tomatoes 400g',       'Italian plum tomatoes in juice, tin',        'tin'),
        ('SKU-010', 'Orange Juice 1L',             'Freshly squeezed orange juice, chilled',     'unit')
      ON CONFLICT DO NOTHING
      RETURNING id, sku
    `)
    console.log(`Inserted ${products.length} products`)

    // Re-fetch all products in order
    const { rows: allProducts } = await client.query(
      `SELECT id FROM products WHERE sku IN
        ('SKU-001','SKU-002','SKU-003','SKU-004','SKU-005',
         'SKU-006','SKU-007','SKU-008','SKU-009','SKU-010')
       ORDER BY sku`
    )
    const [p1,p2,p3,p4,p5,p6,p7,p8,p9,p10] = allProducts.map(r => r.id)

    // Stock levels — (product_id, location_id, quantity, reorder_point)
    // Several rows have quantity < reorder_point so alerts fire immediately.
    const stockRows = [
      // London
      [p1,  locLon, 150,  40],
      [p2,  locLon,  18,  25],  // LOW
      [p3,  locLon,  60,  30],
      [p4,  locLon,  10,  20],  // LOW
      [p5,  locLon, 200,  50],
      [p6,  locLon,  35,  30],
      [p7,  locLon,  80,  25],
      [p8,  locLon, 120,  40],
      [p9,  locLon, 300,  60],
      [p10, locLon,  22,  30],  // LOW

      // Manchester
      [p1,  locMan,  90,  40],
      [p2,  locMan,  40,  25],
      [p3,  locMan,   8,  30],  // LOW
      [p4,  locMan,  55,  20],
      [p5,  locMan, 110,  50],
      [p6,  locMan,  12,  30],  // LOW
      [p7,  locMan,  60,  25],
      [p8,  locMan,  75,  40],
      [p9,  locMan, 180,  60],
      [p10, locMan,  45,  30],

      // Birmingham
      [p1,  locBir, 200,  40],
      [p2,  locBir,  30,  25],
      [p3,  locBir,  50,  30],
      [p4,  locBir,  18,  20],
      [p5,  locBir,  15,  50],  // LOW
      [p6,  locBir,  70,  30],
      [p7,  locBir,  10,  25],  // LOW
      [p8,  locBir,  90,  40],
      [p9,  locBir, 250,  60],
      [p10, locBir,  60,  30],

      // Leeds
      [p1,  locLee, 130,  40],
      [p2,  locLee,  50,  25],
      [p3,  locLee,  25,  30],
      [p4,  locLee,  40,  20],
      [p5,  locLee, 170,  50],
      [p6,  locLee,  28,  30],
      [p7,  locLee,  55,  25],
      [p8,  locLee,   5,  40],  // LOW
      [p9,  locLee, 100,  60],
      [p10, locLee,  20,  30],  // LOW
    ]

    let stockInserted = 0
    for (const [productId, locationId, quantity, reorderPoint] of stockRows) {
      const result = await client.query(
        `INSERT INTO stock_levels (product_id, location_id, quantity, reorder_point)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (product_id, location_id) DO NOTHING`,
        [productId, locationId, quantity, reorderPoint]
      )
      stockInserted += result.rowCount
    }
    console.log(`Inserted ${stockInserted} stock level rows`)

    await client.query('COMMIT')
    console.log('Seed complete.')
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
