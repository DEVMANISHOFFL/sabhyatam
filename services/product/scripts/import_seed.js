const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const argv = yargs(hideBin(process.argv))
  .option("db", { type: "string" })
  .parse();

const DB = argv.db || process.env.DB;

if (!DB) {
  console.error("Missing database connection string. Provide --db or DB env var.");
  process.exit(1);
}

async function run() {
  const client = new Client({ connectionString: DB });
  await client.connect();

  // Adjusted path based on standard 'scripts' vs 'seed' folder structure
const seedPath = path.join(__dirname, "seed", "seed_products.json");  

  if (!fs.existsSync(seedPath)) {
      console.error(`Seed file not found at: ${seedPath}`);
      process.exit(1);
  }

  const products = JSON.parse(fs.readFileSync(seedPath, "utf8"));

  for (const p of products) {
    /* ---------------------------------------------------------
       1. FLATTEN DATA: Extract Price/Stock from First Variant
    ---------------------------------------------------------- */
    let price = p.price;
    let mrp = p.mrp;
    let stock = p.stock;
    let sku = p.sku;

    // If product-level fields are missing, pull from the first variant
    if (p.variants && p.variants.length > 0) {
        const v = p.variants[0];
        if (price === undefined) price = v.price;
        if (mrp === undefined) mrp = v.mrp;
        if (stock === undefined) stock = v.stock;
        if (sku === undefined) sku = v.sku;
    }

    // Defaults/Fallbacks
    if (price === undefined) price = 0;
    if (stock === undefined) stock = 0;
    // Generate a SKU if missing to satisfy UNIQUE constraint
    if (!sku) sku = `SKU-${p.slug}-${Date.now().toString().slice(-6)}`;

    /* -----------------------------
       PRODUCT (Single Table Insert)
    ------------------------------ */
    const productRes = await client.query(
      `
      INSERT INTO products (
        slug, title, short_desc, long_desc,
        category, subcategory, attributes,
        tags, vendor_id, published,
        price, mrp, stock, sku
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (slug) DO UPDATE SET
        price = EXCLUDED.price,
        stock = EXCLUDED.stock,
        mrp = EXCLUDED.mrp,
        sku = EXCLUDED.sku
      RETURNING id
      `,
      [
        p.slug,
        p.title,
        p.short_desc || null,
        p.long_desc || null,
        p.category || null,
        p.subcategory || null,
        JSON.stringify(p.attributes || {}),
        p.tags || [],
        p.vendor_id || null,
        p.published || false,
        price,
        mrp || null,
        stock,
        sku
      ]
    );

    const productId = productRes.rows[0].id;

    /* -----------------------------
       MEDIA (No Variant ID)
    ------------------------------ */
    if (p.media?.length) {
      for (const m of p.media) {
        await client.query(
          `
          INSERT INTO product_media (
            product_id, url,
            media_type, meta
          )
          VALUES ($1,$2,$3,$4)
          ON CONFLICT (url) DO NOTHING
          `,
          [
            productId,
            m.url,
            m.media_type || "image",
            JSON.stringify(m.meta || {}),
          ]
        );
      }
    }

    console.log(`Seeded product: ${p.title} | SKU: ${sku} | Stock: ${stock}`);
  }

  await client.end();
  console.log("Done importing seed products (flattened).");
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});