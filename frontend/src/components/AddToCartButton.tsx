'use client'

import { useState } from 'react'
import { addToCart } from '@/lib/cart'

export default function AddToCartButton({
  productId,
  variantId,
}: {
  productId: string
  variantId: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    setLoading(true)
    try {
      await addToCart({
        product_id: productId,
        variant_id: variantId,
        quantity: 1,
      })
      alert('Added to cart')
    } catch {
      alert('Failed to add to cart')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className="w-full bg-black text-white py-3 rounded-lg"
    >
      {loading ? 'Adding…' : 'Add to Cart'}
    </button>
  )
}
