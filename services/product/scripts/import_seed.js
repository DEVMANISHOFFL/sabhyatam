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

  const seedPath = path.join(__dirname, "seed", "seed_products.json");
  const products = JSON.parse(fs.readFileSync(seedPath, "utf8"));

  for (const p of products) {
    /* -----------------------------
       PRODUCT (idempotent by slug)
    ------------------------------ */
    const productRes = await client.query(
      `
      INSERT INTO products (
        slug, title, short_desc, long_desc,
        category, subcategory, attributes,
        tags, vendor_id, published
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (slug) DO NOTHING
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
      ]
    );

    const productId =
      productRes.rows[0]?.id ||
      (
        await client.query(
          `SELECT id FROM products WHERE slug = $1`,
          [p.slug]
        )
      ).rows[0].id;

    /* -----------------------------
       VARIANTS (idempotent by SKU)
    ------------------------------ */
    if (p.variants?.length) {
      for (const v of p.variants) {
        await client.query(
          `
          INSERT INTO product_variants (
            product_id, sku, price, mrp,
            stock, attributes, weight_grams
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          ON CONFLICT (sku) DO NOTHING
          `,
          [
            productId,
            v.sku,
            v.price,
            v.mrp || null,
            v.stock || 0,
            JSON.stringify(v.attributes || {}),
            v.weight_grams || null,
          ]
        );
      }
    }

    /* -----------------------------
       MEDIA (idempotent by URL)
    ------------------------------ */
    if (p.media?.length) {
      for (const m of p.media) {
        await client.query(
          `
          INSERT INTO product_media (
            product_id, variant_id, url,
            media_type, meta
          )
          VALUES ($1,$2,$3,$4,$5)
          ON CONFLICT (url) DO NOTHING
          `,
          [
            productId,
            null,
            m.url,
            m.media_type || "image",
            JSON.stringify(m.meta || {}),
          ]
        );
      }
    }

    console.log(`Seeded product: ${p.title}`);
  }

  await client.end();
  console.log("Done importing seed products (idempotent).");
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
