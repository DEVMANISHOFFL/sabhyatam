// export const CATEGORIES = [
//   { label: "Silk Sarees", slug: "silk" },
//   { label: "Cotton Sarees", slug: "cotton" },
//   { label: "Banarasi", slug: "banarasi" },
//   { label: "Kanjivaram", slug: "kanjivaram" },
//   { label: "Wedding Collection", slug: "wedding" },
//   { label: "Party Wear", slug: "party" },
//   { label: "Designer Sarees", slug: "designer" },
//   { label: "Daily Wear", slug: "daily" },
//   { label: "Festival Special", slug: "festival" },
//   { label: "Under ₹999", slug: "under-999" },
// ]

export type CategoryConfig = {
  label: string
  slug: string
  subcategories: {
    label: string
    slug: string
  }[]
}

export const CATEGORIES: CategoryConfig[] = [
  {
    label: "Silk Sarees",
    slug: "silk-sarees",
    subcategories: [
      { label: "Kanjivaram", slug: "kanjivaram" },
      { label: "Banarasi", slug: "banarasi" },
      { label: "Tussar", slug: "tussar" },
      { label: "Mysore Silk", slug: "mysore-silk" },
    ],
  },
  {
    label: "Handloom Sarees",
    slug: "handloom-sarees",
    subcategories: [
      { label: "Chanderi", slug: "chanderi" },
      { label: "Ikat", slug: "ikat" },
    ],
  },
  {
    label: "Designer Sarees",
    slug: "designer-sarees",
    subcategories: [
      { label: "Organza", slug: "organza" },
      { label: "Velvet", slug: "velvet" },
    ],
  },
  {
    label: "Printed Sarees",
    slug: "printed-sarees",
    subcategories: [
      { label: "Bandhani", slug: "bandhani" },
      { label: "Satin Print", slug: "satin-print" },
    ],
  },
  {
    label: "Cotton Sarees",
    slug: "cotton-sarees",
    subcategories: [
      { label: "Kota Doria", slug: "kota-doria" },
    ],
  },
]
