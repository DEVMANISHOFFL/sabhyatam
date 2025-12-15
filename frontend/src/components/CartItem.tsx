'use client'

import { updateCartItem, removeCartItem } from '@/lib/cart'
import { useState } from 'react'

export default function CartItem({ item, onRefresh }: any) {
  const [loading, setLoading] = useState(false)

  async function updateQty(qty: number) {
    setLoading(true)
    await updateCartItem({
      variant_id: item.variant.id,
      quantity: qty,
    })
    setLoading(false)
    onRefresh()
  }

  async function remove() {
    setLoading(true)
    await removeCartItem(item.variant.id)
    setLoading(false)
    onRefresh()
  }

  return (
    <div className="flex gap-4 border-b py-4">
      <img
        src={item.product.image}
        className="w-20 h-28 object-cover rounded"
      />

      <div className="flex-1">
        <h3 className="font-medium">{item.product.title}</h3>
        <p className="text-sm text-gray-500">₹{item.variant.price}</p>

        <div className="flex items-center gap-2 mt-2">
          <button onClick={() => updateQty(item.quantity - 1)} disabled={loading || item.quantity <= 1}>
            −
          </button>
          <span>{item.quantity}</span>
          <button onClick={() => updateQty(item.quantity + 1)} disabled={loading}>
            +
          </button>

          <button onClick={remove} className="ml-4 text-red-600">
            Remove
          </button>
        </div>
      </div>

      <div className="font-semibold">
        ₹{item.line_total}
      </div>
    </div>
  )
}
