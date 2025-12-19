'use client'

import { updateCartItem, removeFromCart } from '@/lib/cart'
import { formatPrice } from '@/lib/utils'
import { useState } from 'react'

export default function CartItem({ item, onRefresh }: any) {
  const [loading, setLoading] = useState(false)

  // FIX: Access ID directly from product (Variants are removed)
  const productId = item.product.id

  async function updateQty(qty: number) {
    setLoading(true)
    // FIX: Pass arguments directly (productId, quantity) based on new cart.ts
    await updateCartItem(productId, qty)
    setLoading(false)
    onRefresh()
  }

  async function remove() {
    setLoading(true)
    // FIX: Pass productId directly
    await removeFromCart(productId)
    setLoading(false)
    onRefresh()
  }

  // Helper to handle backend returning paise (int64) while UI expects Rupees
  const displayPrice = (val: number) => formatPrice(val / 100)

  return (
    <div className="flex gap-4 border-b py-4">
      <img
        src={item.product.image}
        alt={item.product.title}
        className="w-20 h-28 object-cover rounded"
      />

      <div className="flex-1">
        <h3 className="font-medium">{item.product.title}</h3>
        {/* FIX: Use unit_price from flattened cart structure */}
        <p className="text-sm text-gray-500">{displayPrice(item.unit_price)}</p>

        <div className="flex items-center gap-2 mt-2">
          <button 
            className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-50 disabled:opacity-50"
            onClick={() => updateQty(item.quantity - 1)} 
            disabled={loading || item.quantity <= 1}
          >
            −
          </button>
          <span className="w-8 text-center">{item.quantity}</span>
          <button 
            className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-50 disabled:opacity-50"
            onClick={() => updateQty(item.quantity + 1)} 
            disabled={loading}
          >
            +
          </button>

          <button onClick={remove} className="ml-4 text-xs text-red-600 hover:underline">
            Remove
          </button>
        </div>
      </div>

      <div className="font-semibold">
        {displayPrice(item.line_total)}
      </div>
    </div>
  )
}