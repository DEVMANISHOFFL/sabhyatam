'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Package, ArrowRight, Loader2 } from 'lucide-react'

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('order_id')

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const pollingRef = useRef(false)

  useEffect(() => {
    if (!orderId || pollingRef.current) return
    pollingRef.current = true

    let attempts = 0
    const MAX_ATTEMPTS = 20 // Increased attempts to give backend time

    const poll = async () => {
      try {
        const res = await fetch(
          `http://localhost:8082/v1/orders/${orderId}/public`,
          { cache: 'no-store' }
        )

        // If order not found (404), wait and retry
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

        // ✅ FIX 1: Removed the 'mock-success' POST call. 
        // The CheckoutPage already triggered payment. We just wait for status to update.

        // If still pending, wait and retry
        if (data.status === 'pending_payment' || data.status === 'pending') {
          attempts++
          if (attempts < MAX_ATTEMPTS) {
            setTimeout(poll, 1000)
            return
          }
          // If it stays pending too long, show what we have (or redirect)
        }

        setOrder(data)
        setLoading(false)
      } catch (err) {
        console.error("Polling error:", err)
        // Don't redirect immediately on network error, maybe retry? 
        // For now, stopping loading to show state is safer than redirecting blindly.
        setLoading(false) 
      }
    }

    poll()
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

  // Safety check if polling finished but order is null (failed fetch)
  if (!order) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Order details could not be loaded.</p>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6] py-12 px-4">
      <div className="max-w-xl mx-auto">
        
        {/* Success Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden text-center p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-500 mb-8">
            Thank you for shopping with Sabhyatam. Your order has been placed successfully.
          </p>

          {/* Order Details Snippet */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left border border-gray-100">
            <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-4">
               <div>
                 <p className="text-xs text-gray-500 uppercase tracking-wider">Order ID</p>
                 <p className="font-mono font-bold text-gray-900">{order.id?.slice(0, 8).toUpperCase()}</p>
               </div>
               <div className="text-right">
                 <p className="text-xs text-gray-500 uppercase tracking-wider">Amount</p>
                 <p className="font-bold text-gray-900">
                    {/* ✅ FIX 2: Use 'subtotal' instead of 'amount_cents' based on backend API */}
                    ₹{((order.subtotal || 0) / 100).toLocaleString('en-IN')}
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

          {/* Actions */}
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

        {/* Support Link */}
        <div className="text-center mt-8">
           <Link href="/help" className="text-sm text-gray-500 hover:text-black hover:underline">
             Need help with this order?
           </Link>
        </div>

      </div>
    </div>
  )
}