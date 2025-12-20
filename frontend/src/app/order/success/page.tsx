'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Package, ArrowRight, Loader2 } from 'lucide-react'

// OPTIONAL: If you use a Context for cart, import it here.
// import { useCart } from '@/context/CartContext' 

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('order_id')

  // OPTIONAL: If you use context, destructure the clear function
  // const { clearCart } = useCart() 

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const pollingRef = useRef(false)

  useEffect(() => {
    if (!orderId || pollingRef.current) return
    pollingRef.current = true

    let attempts = 0
    const MAX_ATTEMPTS = 20

    const poll = async () => {
      try {
        const res = await fetch(
          `http://localhost:8082/v1/orders/${orderId}/public`,
          { cache: 'no-store' }
        )

        if (res.status === 404) {
          attempts++
          if (attempts < MAX_ATTEMPTS) {
            setTimeout(poll, 1000)
            return
          }
          router.replace('/order/failed')
          return
        }

        const data = await res.json()

        if (data.status === 'pending_payment' || data.status === 'pending') {
          attempts++
          if (attempts < MAX_ATTEMPTS) {
            setTimeout(poll, 1000)
            return
          }
        }

        // --- SUCCESS! Order is confirmed ---
        setOrder(data)
        setLoading(false)

        // ✅ FIX: EMPTY THE CART HERE
        // 1. If using LocalStorage (Most Common):
        // Replace 'cart' with the actual key you use (e.g., 'sabhyatam-cart', 'shopping-cart')
        if (typeof window !== 'undefined') {
            localStorage.removeItem('cart') 
            
            // Dispatch event to update navbar/header cart count immediately
            window.dispatchEvent(new Event('storage')) 
        }

        // 2. If using a Context/Hook (Cleaner method):
        // clearCart() 

      } catch (err) {
        console.error("Polling error:", err)
        setLoading(false) 
      }
    }

    poll()
  // Add dependencies if you use a context function like clearCart
  }, [orderId, router]) 

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
        <h2 className="text-xl font-medium text-gray-900">Verifying your order...</h2>
        <p className="text-sm text-gray-500">Please do not close this window.</p>
      </div>
    )
  }

  if (!order) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Order details could not be loaded.</p>
        </div>
    )
  }

  // Price Calculation Fix
  const rawAmount = order.subtotal ?? order.amount_cents ?? 0
  const finalAmount = rawAmount / 100

  return (
    <div className="min-h-screen bg-[#f1f3f6] py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden text-center p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-500 mb-8">
            Thank you for shopping with Sabhyatam. Your order has been placed successfully.
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left border border-gray-100">
            <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Order ID</p>
                <p className="font-mono font-bold text-gray-900">{order.id?.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Amount</p>
                <p className="font-bold text-gray-900">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0
                    }).format(finalAmount)}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                  <p className="text-sm font-medium text-gray-900">Estimated Delivery</p>
                  <p className="text-sm text-gray-500">3-5 Business Days</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full bg-black text-white py-4 rounded-lg font-bold hover:bg-gray-900 transition flex items-center justify-center gap-2"
            >
              Continue Shopping <ArrowRight className="h-4 w-4" />
            </button>
            
            <Link 
              href="/track" 
              className="block w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Track Order
            </Link>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/help" className="text-sm text-gray-500 hover:text-black hover:underline">
            Need help with this order?
          </Link>
        </div>

      </div>
    </div>
  )
}