// import_seed.js
// Usage: node import_seed.js --db "postgres://postgres:postgres@localhost:5432/sabhyatam?sslmode=disable"

const fs = require('fs');
const { Client } = require('pg');

// FIX: Correct yargs usage in CommonJS
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const argv = yargs(hideBin(process.argv))
  .option('db', { type: 'string', demandOption: true })
  .parse();
const DB = argv.db;

async function run() {
  const client = new Client({ connectionString: DB });
  await client.connect();
  const raw = fs.readFileSync('../seed/seed_products.json', 'utf8');
  const products = JSON.parse(raw);

  for (const p of products) {
    // insert product
    const productRes = await client.query(
      `INSERT INTO products (slug, title, short_desc, long_desc, category, subcategory, attributes, tags, vendor_id, published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [
        p.slug, p.title, p.short_desc || null, p.long_desc || null,
        p.category || null, p.subcategory || null,
        JSON.stringify(p.attributes || {}), p.tags || [], p.vendor_id || null, p.published || false
      ]
    );
    const productId = productRes.rows[0].id;

    // variants
    if (p.variants && p.variants.length) {
      for (const v of p.variants) {
        await client.query(
          `INSERT INTO product_variants (product_id, sku, price, mrp, stock, attributes, weight_grams)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [productId, v.sku, v.price, v.mrp || null, v.stock || 0, JSON.stringify(v.attributes || {}), v.weight_grams || null]
        );
      }
    }

    // media
    if (p.media && p.media.length) {
      for (const m of p.media) {
        await client.query(
          `INSERT INTO product_media (product_id, variant_id, url, media_type, meta)
           VALUES ($1,$2,$3,$4,$5)`,
          [productId, null, m.url, m.media_type || 'image', JSON.stringify(m.meta || {})]
        );
      }
    }

    console.log(`Inserted product ${p.title}`);
  }

  await client.end();
  console.log('Done importing seed products.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
