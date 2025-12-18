import fs from "fs"
import { v4 as uuid } from "uuid"

const fabrics = [
  { fabric: "pure silk", weave: "kanjivaram", origin: "Tamil Nadu", category: "Silk Sarees", sub: "Kanjivaram" },
  { fabric: "silk", weave: "banarasi", origin: "Uttar Pradesh", category: "Silk Sarees", sub: "Banarasi" },
  { fabric: "cotton-silk", weave: "chanderi", origin: "Madhya Pradesh", category: "Handloom Sarees", sub: "Chanderi" },
  { fabric: "cotton", weave: "ikat", origin: "Odisha", category: "Handloom Sarees", sub: "Ikat" },
  { fabric: "organza", weave: "banarasi", origin: "Uttar Pradesh", category: "Designer Sarees", sub: "Organza" },
  { fabric: "georgette", weave: "bandhani", origin: "Gujarat", category: "Printed Sarees", sub: "Bandhani" },
  { fabric: "tussar silk", weave: "tussar", origin: "Madhya Pradesh", category: "Silk Sarees", sub: "Tussar" },
  { fabric: "cotton", weave: "kota", origin: "Rajasthan", category: "Cotton Sarees", sub: "Kota Doria" },
  { fabric: "silk", weave: "mysore", origin: "Karnataka", category: "Silk Sarees", sub: "Mysore Silk" },
  { fabric: "velvet", weave: "embroidery", origin: "Unknown", category: "Designer Sarees", sub: "Velvet" }
]

const colors = [
  "maroon", "emerald green", "wine red", "peacock blue", "pastel peach",
  "mint green", "indigo", "mustard yellow", "coral pink", "midnight black"
]

const occasions = [
  ["bridal", "wedding"],
  ["festive"],
  ["party"],
  ["casual"],
  ["office"],
  ["formal"],
  ["reception"]
]

const sarees = []

for (let i = 1; i <= 100; i++) {
  const f = fabrics[i % fabrics.length]
  const color = colors[i % colors.length]

  const slug = `${f.weave}-${color.replace(/\s+/g, "-")}-${i}`

  sarees.push({
    title: `${f.weave.toUpperCase()} ${f.fabric} Saree – ${color}`,
    slug,
    short_desc: `Premium ${f.weave} ${f.fabric} saree in ${color}.`,
    long_desc: `Handcrafted ${f.weave} saree from ${f.origin}, 5.5 meters with blouse piece.`,
    category: f.category,
    subcategory: f.sub,
    attributes: {
      fabric: f.fabric,
      weave: f.weave,
      origin: f.origin,
      occasion: occasions[i % occasions.length],
      length_meters: 5.5,
      care: "dry clean only"
    },
    tags: [f.weave, f.fabric, "handloom"],
    vendor_id: null,
    published: true,
    variants: [
      {
        sku: `SB-${f.weave.toUpperCase().slice(0,3)}-${i}-A`,
        price: 3000 + i * 120,
        mrp: 4000 + i * 150,
        stock: 5 + (i % 20),
        attributes: { color }
      }
    ],
    media: [
      {
        url: `https://cdn.sabhyatam.com/prod/${slug}/hero.jpg`,
        media_type: "image",
        meta: { role: "hero", order: 1 }
      }
    ]
  })
}

fs.writeFileSync("sarees-100.json", JSON.stringify(sarees, null, 2))
console.log("✅ Generated sarees-100.json")
