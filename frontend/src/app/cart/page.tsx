'use client'

import { useEffect, useState } from 'react'
import { getCart, updateCartItem, removeCartItem } from '@/lib/cart'

export default function CartPage() {
  const [cart, setCart] = useState<any>(null)

  async function load() {
    const data = await getCart()
    setCart(data)
  }

  useEffect(() => {
    load()
  }, [])

  if (!cart) return <div className="p-6">Loading cart…</div>

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Your Cart</h1>

      {cart.items.map((item: any) => (
        <div key={item.variant_id} className="flex gap-4 border-b pb-4">
          <div className="flex-1">
            <p className="font-medium">{item.title}</p>
            <p>₹{item.price}</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() =>
                  updateCartItem({
                    variant_id: item.variant_id,
                    quantity: item.quantity - 1,
                  }).then(load)
                }
              >
                −
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() =>
                  updateCartItem({
                    variant_id: item.variant_id,
                    quantity: item.quantity + 1,
                  }).then(load)
                }
              >
                +
              </button>
            </div>
          </div>

          <button
            className="text-red-600"
            onClick={() => removeCartItem(item.variant_id).then(load)}
          >
            Remove
          </button>
        </div>
      ))}

      <div className="text-right text-xl font-bold">
        Total: ₹{cart.total_price}
      </div>

      <button className="w-full bg-black text-white py-4 rounded-lg">
        Proceed to Checkout
      </button>
    </div>
  )
}
