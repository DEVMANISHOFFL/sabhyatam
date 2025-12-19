'use client'

import { updateCartItem, removeFromCart } from '@/lib/cart'
import { formatPrice } from '@/lib/utils'
import { useState } from 'react'

export default function CartItem({ item, onRefresh }: any) {
  const [loading, setLoading] = useState(false)

  const productId = item.product.id

  async function updateQty(qty: number) {
    setLoading(true)
    await updateCartItem(productId, qty)
    setLoading(false)
    onRefresh()
  }

  async function remove() {
    setLoading(true)
    await removeFromCart(productId)
    setLoading(false)
    onRefresh()
  }

  const displayPrice = (val: number) => formatPrice(val / 100)

  // 🛠️ ROBUST IMAGE FINDER
  // Checks for:
  // 1. item.product.image (if backend flattens it)
  // 2. item.product.media[0].url (standard backend response)
  // 3. item.image_url (legacy)
  // 4. Placeholder
  const imageUrl = 
    item.product.image || 
    (item.product.media && item.product.media.length > 0 ? item.product.media[0].url : null) ||
    item.image_url ||
    "/placeholder.svg"

  return (
    <div className="flex gap-4 border-b py-4">
      <div className="h-28 w-20 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100">
        <img
          src={imageUrl}
          alt={item.product.title}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{item.product.title}</h3>
        <p className="text-sm text-gray-500">{displayPrice(item.unit_price)}</p>

        <div className="flex items-center gap-2 mt-3">
          <button 
            className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-50 disabled:opacity-50 transition"
            onClick={() => updateQty(item.quantity - 1)} 
            disabled={loading || item.quantity <= 1}
          >
            −
          </button>
          <span className="w-8 text-center font-medium">{item.quantity}</span>
          <button 
            className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-50 disabled:opacity-50 transition"
            onClick={() => updateQty(item.quantity + 1)} 
            disabled={loading}
          >
            +
          </button>

          <button onClick={remove} className="ml-4 text-xs font-medium text-red-600 hover:text-red-800 hover:underline transition">
            Remove
          </button>
        </div>
      </div>

      <div className="font-semibold text-gray-900">
        {displayPrice(item.line_total)}
      </div>
    </div>
  )
}