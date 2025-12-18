"use client"

import { useState } from "react"
import { Heart, ShieldCheck, RefreshCw, Lock } from "lucide-react"
import { addToCart } from "@/lib/cart"
import { emitCartUpdated } from "@/lib/cart-events"


type MediaItem = {
  id: string
  url: string
  meta: { role: "hero" | "gallery" }
}

type Variant = {
  id: string  
  price: number
  mrp?: number
  stock: number
}

type Product = {
  id: string
  title: string
  short_desc?: string
  attributes?: Record<string, any>
}

type ProductDetailPageProps = {
  product: Product
  variants: Variant[]
  media: MediaItem[]
}

export default function ProductDetailPage({ product, variants, media }: ProductDetailPageProps) {
  const galleryImages = media.filter((m) => m.meta.role === "gallery")
  
  const safeMedia = Array.isArray(media) ? media : []
  const safeVariants = Array.isArray(variants) ? variants : []
  
  const heroImage =safeMedia.find((m) => m.meta?.role === "hero") || safeMedia[0] || null
  const [selectedImage, setSelectedImage] = useState( heroImage?.url ?? "/placeholder.png")
const variant = safeVariants[0] ?? null
  const isInStock = variant && variant.stock > 0
  const discount = variant?.mrp ? Math.round(((variant.mrp - variant.price) / variant.mrp) * 100) : 0
const [adding, setAdding] = useState(false)

async function handleBuyNow() {
  await handleAddToCart()
  window.location.href = "/cart"
}


async function handleAddToCart() {
  if (!variant) return

  try {
    setAdding(true)

    await addToCart({
      product_id: product.id,
      variant_id: variant.id,
      quantity: 1,
    })

    // optional UX
    // alert("Added to cart")

  } catch (e: any) {
    alert(e.message || "Failed to add to cart")
  } finally {
    setAdding(false)
  }
}


  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const attributeLabels: Record<string, string> = {
    fabric: "Fabric",
    weave: "Weave Type",
    origin: "Origin",
    occasion: "Occasion",
    care: "Care Instructions",
  }

  return (
    <>
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-8">
          <div className="grid gap-6 md:grid-cols-2 md:gap-8 lg:gap-12">
            {/* LEFT: Media Section */}
            <div className="flex flex-col-reverse gap-4 md:flex-row">
              {/* Thumbnails */}
              {galleryImages.length > 0 && (
                <div className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
                  {heroImage && (
                    <button
                      onClick={() => setSelectedImage(heroImage.url)}
                      className={`shrink-0 overflow-hidden rounded border-2 transition-all ${
                        selectedImage === heroImage.url ? "border-blue-600" : "border-gray-200"
                      }`}
                    >

                      <img
                        src={heroImage.url || "/placeholder.svg"}
                        alt="Main"
                        className="h-16 w-16 object-cover md:h-20 md:w-20"
                      />
                    </button>
                  )}
                  {galleryImages.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img.url)}
                      className={`shrink-0 overflow-hidden rounded border-2 transition-all ${
                        selectedImage === img.url ? "border-blue-600" : "border-gray-200"
                      }`}
                    >
                      <img
                        src={img.url || "/placeholder.svg"}
                        alt={`Gallery ${img.id}`}
                        className="h-16 w-16 object-cover md:h-20 md:w-20"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image */}
              <div className="flex-1">
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  {selectedImage ? (
                                            <div className="w-full aspect-square bg-gray-50 border rounded-lg overflow-hidden flex items-center justify-center">

                    <img
                      src={selectedImage || "/placeholder.svg"}
                      alt={product.title}
    className="w-full h-full object-contain"
                    />
                    </div>
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center bg-gray-100 text-gray-400">
                      No image available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Product Info */}
            <div className="flex flex-col">
              {/* Title */}
              <h1 className="text-pretty text-xl font-bold leading-tight text-gray-900 md:text-2xl">{product.title}</h1>

              {product.short_desc && <p className="mt-2 text-sm text-gray-600">{product.short_desc}</p>}

              {/* Ratings */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-sm font-semibold text-white">
                  4.4 <span className="text-xs">★</span>
                </div>
                <span className="text-sm text-gray-600">({(12847).toLocaleString("en-IN")} ratings)</span>
              </div>

              {/* Price Block */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">{formatINR(variant?.price || 0)}</span>
                {variant?.mrp && variant.mrp > variant.price && (
                  <>
                    <span className="text-lg text-gray-500 line-through">{formatINR(variant.mrp)}</span>
                    <span className="text-lg font-semibold text-green-600">{discount}% off</span>
                  </>
                )}
              </div>

              {/* Stock Status */}
              <div className="mt-3">
                {isInStock ? (
                  <span className="text-sm font-medium text-green-600">In Stock</span>
                ) : (
                  <span className="text-sm font-medium text-red-600">Out of Stock</span>
                )}
              </div>

              {/* Delivery */}
              <div className="mt-2 text-sm text-gray-700">
                Delivery by <span className="font-semibold">Tomorrow</span> |{" "}
                <span className="text-green-600">Free</span>
              </div>

              {/* CTAs - Desktop */}
              <div className="mt-6 hidden gap-3 md:flex">
         <button
  disabled={!isInStock}
  onClick={async () => {
    if (!variant) return

    await addToCart({
      product_id: product.id,
      variant_id: variant.id,
      quantity: 1,
    })

    emitCartUpdated()
  }}
  className="flex-1 rounded bg-yellow-500 px-6 py-3 font-semibold text-white hover:bg-yellow-600 disabled:bg-gray-300"
>
  Add to Cart
</button>




               <button
  onClick={handleBuyNow}
  disabled={!isInStock || adding}
  className="flex-1 rounded bg-orange-500 px-6 py-3 font-semibold text-white"
>
  Buy Now
</button>

                <button
                  className="rounded border-2 border-gray-300 p-3 transition-colors hover:border-red-500 hover:bg-red-50"
                  aria-label="Add to wishlist"
                >
                  <Heart className="h-6 w-6 text-gray-600" />
                </button>
              </div>

              {/* Trust Strip */}
              <div className="mt-6 grid grid-cols-3 gap-3 border-y border-gray-200 py-4">
                <div className="flex flex-col items-center gap-1 text-center">
                  <ShieldCheck className="h-5 w-5 text-gray-700" />
                  <span className="text-xs text-gray-700">Authentic Product</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <RefreshCw className="h-5 w-5 text-gray-700" />
                  <span className="text-xs text-gray-700">7 Days Return</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <Lock className="h-5 w-5 text-gray-700" />
                  <span className="text-xs text-gray-700">Secure Payments</span>
                </div>
              </div>

              {/* Product Details */}
              <div className="mt-6">
                <h2 className="text-lg font-bold text-gray-900">Product Details</h2>
                <div className="mt-4 grid gap-3">
                  {product.attributes &&
                    Object.entries(attributeLabels).map(([key, label]) => {
                      const value = product.attributes?.[key]
                      return (
                        <div
                          key={key}
                          className="grid grid-cols-[140px_1fr] gap-4 border-b border-gray-100 pb-3 text-sm"
                        >
                          <span className="font-medium text-gray-600">{label}</span>
                          <span className="text-gray-900">
                            {value ? (Array.isArray(value) ? value.join(", ") : value) : "—"}
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA Bar - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-3 shadow-lg md:hidden">
        <div className="flex gap-2">
      <button
  disabled={!isInStock}
  onClick={async () => {
    if (!variant) return

    await addToCart({
      product_id: product.id,
      variant_id: variant.id,
      quantity: 1,
    })

    emitCartUpdated()
  }}
  className="flex-1 rounded bg-yellow-500 px-6 py-3 font-semibold text-white hover:bg-yellow-600 disabled:bg-gray-300"
>
  Add to Cart
</button>


        <button
  onClick={handleBuyNow}
  disabled={!isInStock || adding}
  className="flex-1 rounded bg-orange-500 px-6 py-3 font-semibold text-white"
>
  Buy Now
</button>


          <button
            className="rounded border-2 border-gray-300 px-4 hover:border-red-500 hover:bg-red-50"
            aria-label="Add to wishlist"
          >
            <Heart className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
    </>
  )
}
