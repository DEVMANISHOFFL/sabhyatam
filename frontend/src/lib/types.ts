export type AdminProduct = {
  id: string
  slug: string
  title: string
  category: string
  description?: string
  price: number
  mrp?: number
  in_stock: boolean
  published: boolean
}

export type ProductMedia = {
  id: string
  url: string
  media_type: "image"
  meta: {
    role: "hero" | "gallery"
    order: number
  }
}
