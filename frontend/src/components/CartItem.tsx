'use client'

import { updateCartItem, removeFromCart } from '@/lib/cart'
import { formatPrice } from '@/lib/utils'
import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function CartItem({ item, onRefresh }: any) {
  const [loading, setLoading] = useState(false)

  if (!item || !item.product) return null

  const productId = item.product.id

  async function updateQty(newQty: number) {
    if (newQty < 1) return
    setLoading(true)
    try {
      await updateCartItem(productId, newQty)
      onRefresh()
    } catch (error) {
      console.error("Failed to update quantity", error)
    } finally {
      setLoading(false)
    }
  }

  async function remove() {
    setLoading(true)
    try {
      await removeFromCart(productId)
      onRefresh()
    } catch (error) {
      console.error("Failed to remove item", error)
    } finally {
      setLoading(false)
    }
  }

  // ✅ FIX: Removed '/ 100' assuming backend sends Rupees
  const displayPrice = (amount: number) => {
    return formatPrice(amount) 
  }

  const imageUrl = 
    item.product?.image || 
    item.product?.media?.[0]?.url ||
    item.image_url ||
    "/placeholder.svg"

  return (
    <div className="flex gap-4 border-b border-gray-100 py-6 last:border-0">
      {/* Product Image */}
      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
        <img
          src={imageUrl}
          alt={item.product.title || "Product"}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex justify-between gap-2">
          <div>
            <Link 
              href={`/product/${item.product.slug}`}
              className="font-medium text-gray-900 hover:text-blue-600 transition line-clamp-2"
            >
              {item.product.title}
            </Link>
            <p className="mt-1 text-sm text-gray-500">
              {displayPrice(item.unit_price)}
            </p>
          </div>
          <div className="font-bold text-gray-900">
            {displayPrice(item.line_total)}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center rounded-md border border-gray-200">
            <button 
              className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              onClick={() => updateQty(item.quantity - 1)} 
              disabled={loading || item.quantity <= 1}
            >
              −
            </button>
            <span className="flex h-8 w-10 items-center justify-center text-sm font-medium border-x border-gray-200">
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
              ) : (
                item.quantity
              )}
            </span>
            <button 
              className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              onClick={() => updateQty(item.quantity + 1)} 
              disabled={loading}
            >
              +
            </button>
          </div>

          <button 
            onClick={remove} 
            disabled={loading}
            className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            REMOVE
          </button>
        </div>
      </div>
    </div>
  )
}