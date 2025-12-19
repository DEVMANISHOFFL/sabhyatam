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
  short_desc?: string;
  media?: ProductMedia[];
  variants?: AdminVariant[];
  attributes?: Record<string, any>  
  tags?: string[]
}

export interface ProductMedia {
  id: string;
  url: string;
  media_type: "image" | "video";
  meta?: {
    role?: "hero" | "gallery";
    order?: number;
  };
}

export interface AdminVariant {
  id: string;
  price: number;
  stock: number;
  attributes?: Record<string, any>;
}
export type AdminProductForm = Omit<
  AdminProduct,
  "price" | "mrp"
> & {
  price: number | ""
  mrp?: number | ""
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
