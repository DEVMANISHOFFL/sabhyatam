'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCart } from '@/lib/cart'
import CartItem from '@/components/CartItem'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Tag
} from 'lucide-react'

export default function CartPage() {
  const [cart, setCart] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  async function load() {
    try {
      const data = await getCart()
      setCart(data)
    } catch (err) {
      console.error(err)
      setError('Failed to load cart')
      setCart({ items: [], subtotal: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (error) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-center max-w-md">
          <p className="font-medium">{error}</p>
          <button onClick={load} className="mt-2 text-sm underline hover:text-red-800">Try Again</button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
         <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-pink-600"></div>
            <p className="text-sm text-gray-500 font-medium">Loading your bag...</p>
         </div>
      </div>
    )
  }

  const items = cart?.items ?? []
  
  // ✅ FIX: Removed '/ 100' since backend is sending Rupees
  const subtotal = cart?.subtotal ?? 0
  
  // Fake discount logic for display
  const estimatedMRP = Math.round(subtotal * 1.25) 
  const totalDiscount = estimatedMRP - subtotal

  return (
    <div className="min-h-screen bg-[#f1f3f6] py-8">
      <div className="mx-auto max-w-6xl px-4">
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">
               Shopping Bag <span className="text-base font-normal text-gray-500">({items.length} items)</span>
            </h1>
        </div>

        {items.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 text-center shadow-sm">
            <div className="mb-6 rounded-full bg-pink-50 p-6">
              <ShoppingBag className="h-12 w-12 text-pink-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Your bag is empty!</h2>
            <p className="mt-2 max-w-xs text-gray-500">Looks like you haven&apos;t added anything to your bag yet.</p>
            <Link 
              href="/"
              className="mt-8 rounded bg-pink-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:bg-pink-700"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            
            {/* LEFT: Cart Items List */}
            <div className="flex-1 space-y-4">
              <div className="rounded-sm bg-white shadow-sm overflow-hidden divide-y divide-gray-100">
                {items.map((item: any) => (
                  <div key={item.product.id} className="p-4 hover:bg-gray-50 transition">
                     <CartItem item={item} onRefresh={load} />
                  </div>
                ))}
              </div>
              
              <div className="rounded-sm bg-white p-4 shadow-sm flex items-center gap-3">
                 <Tag className="h-5 w-5 text-gray-600" />
                 <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">Apply Coupon</p>
                    <p className="text-xs text-gray-500">Login to see available coupons</p>
                 </div>
                 <button className="text-sm font-bold text-pink-600 uppercase">Apply</button>
              </div>
            </div>

            {/* RIGHT: Price Summary */}
            <div className="w-full lg:w-[360px] lg:sticky lg:top-24 space-y-4">
              
              <div className="rounded-sm bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">Price Details</h2>
                
                <div className="space-y-3 border-b border-dashed border-gray-200 pb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total MRP</span>
                    <span>{formatPrice(estimatedMRP)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount on MRP</span>
                    <span className="text-green-600">- {formatPrice(totalDiscount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping Fee</span>
                    <span className="flex items-center gap-1 text-green-600">
                      <span className="text-gray-400 line-through">₹99</span> FREE
                    </span>
                  </div>
                </div>

                <div className="flex justify-between py-4 text-lg font-bold text-gray-900">
                  <span>Total Amount</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                <button
                  onClick={() => router.push('/checkout')}
                  className="group relative w-full overflow-hidden rounded bg-black py-4 font-bold text-white shadow transition hover:bg-gray-900"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    PROCEED TO CHECKOUT <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
                
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  100% Secure Payments
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-gray-500">
                 <div className="bg-white p-2 rounded shadow-sm">
                    <Truck className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                    Fast Delivery
                 </div>
                 <div className="bg-white p-2 rounded shadow-sm">
                    <ShieldCheck className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                    Genuine
                 </div>
                 <div className="bg-white p-2 rounded shadow-sm">
                    <ShoppingBag className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                    7 Days Return
                 </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}