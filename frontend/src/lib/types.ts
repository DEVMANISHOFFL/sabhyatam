// --- PRODUCT TYPES (These are perfect) ---

export type AdminProduct = {
  id: string
  slug: string
  title: string
  category: string
  short_desc?: string
  long_desc?: string
  
  // Commerce Fields (Flattened - No Variants)
  price: number
  mrp?: number
  stock: number
  in_stock: boolean
  sku?: string
  
  published: boolean
  media?: ProductMedia[]
  attributes?: Record<string, any>  
  tags?: string[]
}

export interface ProductMedia {
  id: string
  url: string
  media_type: "image" | "video"
  meta?: {
    role?: "hero" | "gallery"
    order?: number
  }
}

export type AdminProductForm = Omit<AdminProduct, "price" | "mrp" | "stock"> & {
  price: number | ""
  mrp: number | ""
  stock: number | ""
}

export type ProductCard = {
  id: string
  slug: string
  title: string
  category: string
  price: number
  image_url: string | null
  in_stock: boolean
}

// --- CART TYPES (FIXED TO MATCH BACKEND) ---

export type CartItemProduct = {
  id: string
  title: string
  slug: string
  image: string
}

export type CartItem = {
  // Backend returns a nested 'product' object
  product: CartItemProduct
  quantity: number
  unit_price: number // Backend sends 'unit_price', not 'price'
  line_total: number
}

export type Cart = {
  items: CartItem[]
  subtotal: number
  item_count: number
  currency: string
  // 'id', 'tax', and 'total' are not sent by your Cart Service currently
}

// Input for the API call
export type AddToCartInput = {
  product_id: string
  quantity: number
}

export type ProductSearchParams = {
  page: number
  limit: number
  sort?: "latest" | "price_asc" | "price_desc"
  
  q?: string 
  category?: string
  min_price?: number
  max_price?: number
  fabric?: string
  occasion?: string
  color?: string
}