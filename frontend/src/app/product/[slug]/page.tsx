import { api } from "@/lib/api"
import ProductDetailPage from "@/components/ProductDetailPage"
import { notFound } from "next/navigation"

// Define a loose type to handle different backend responses
type ApiResult = {
  product?: any
  id?: string
  title?: string
  media?: any[]
  variants?: any[]
  [key: string]: any
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  try {
    // 1. Fetch by Slug
    let data = await api<ApiResult>(`/v1/products/slug/${slug}`)

    // 2. Normalize the data structure
    // Sometimes backend returns { product: {...} } and sometimes just {...}
    let product = data.product || data
    let media = data.media || product.media || []

    // 3. Validation: Did we find a product?
    if (!product || !product.id) {
      console.error("Product not found for slug:", slug)
      return notFound()
    }

    // 4. ROBUSTNESS FIX:
    // If media is missing (common in 'By Slug' endpoints), fetch full details by ID.
    // We know the Admin page works, and it uses ID-based or List-based data.
    if (!media || media.length === 0) {
      console.log(`Media missing for ${slug}, fetching full details by ID: ${product.id}`)
      try {
        const fullData = await api<ApiResult>(`/v1/products/${product.id}`)
        
        // Merge the new data
        const fullProduct = fullData.product || fullData
        const fullMedia = fullData.media || fullProduct.media || []
        
        if (fullMedia.length > 0) {
          media = fullMedia
          // Update product details too in case the ID endpoint is richer
          product = { ...product, ...fullProduct }
        }
      } catch (innerErr) {
        console.warn("Failed to fetch full product details by ID", innerErr)
      }
    }

    // 5. Ensure media is attached to the product object for the component
    product.media = media

    return <ProductDetailPage product={product} media={media} />

  } catch (err) {
    console.error("Error loading product page:", err)
    return notFound()
  }
}