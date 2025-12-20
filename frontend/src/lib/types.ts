
import { User as SupabaseUser } from "@supabase/supabase-js";

// --- PRODUCT TYPES ---

export type AdminProduct = {
  id: string
  slug: string
  title: string
  category: string
  short_desc?: string
  long_desc?: string
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

// --- CART TYPES (Fixed to match Nested Backend Response) ---

export type CartItemProduct = {
  id: string
  title: string
  slug: string
  price: number
  // Backend returns media array, sometimes image string
  image?: string 
  media?: ProductMedia[]
}

export type CartItem = {
  product: CartItemProduct
  quantity: number
  unit_price: number
  line_total: number
}

export type Cart = {
  items: CartItem[]
  subtotal: number
  item_count: number
  currency: string
}

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

// Extend the default User type to include your custom metadata
export interface User extends SupabaseUser {
  app_metadata: {
    role?: "admin" | "customer";
    provider?: string;
    [key: string]: any;
  };
}

// --- USER & PROFILE TYPES ---

export interface Address {
  id: string
  user_id?: string
  full_name: string
  phone: string
  line1: string
  city: string
  state: string
  pincode: string
  is_default: boolean
}

export interface UserProfile {
  id: string
  email: string // Read-only
  full_name: string
  phone: string
}

export interface UpdateProfileInput {
  full_name?: string
  phone?: string
}

// --- ORDER TYPES ---

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  product_id: string
  product_title: string
  product_image?: string
  quantity: number
  unit_price: number
  line_total: number
}

export interface Order {
  id: string
  created_at: string
  status: string
  total_amount: number
  currency: string
  items: OrderItem[]
  shipping_address?: Address
}