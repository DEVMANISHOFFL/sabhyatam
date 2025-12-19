'use client'

import { useEffect, useState } from 'react'
import { getCart } from '@/lib/cart'
import { getOrCreateSessionId } from '@/lib/session'
import { useRouter } from 'next/navigation'
import { 
  ShieldCheck, 
  MapPin, 
  CheckCircle2, 
  Truck, 
  CreditCard,
  Lock,
  ArrowRight,
  ShoppingBag
} from 'lucide-react'
import Link from 'next/link'

export default function CheckoutPage() {
  const [cart, setCart] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const router = useRouter()

  /**
   * MOCK PAYMENT GATEWAY
   * (Razorpay will replace this later)
   */
  async function openGateway(payment: any) {
    // Visual delay to simulate processing
    await new Promise(r => setTimeout(r, 1000))

    const res = await fetch(
      'http://localhost:8083/v1/payments/mock-success',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: payment.order_id,
        }),
      }
    )

    if (!res.ok) {
      throw new Error('Mock payment failed')
    }

    router.push(`/order/success?order_id=${payment.order_id}`)
  }

  /**
   * PAY HANDLER
   */
  async function handlePay() {
    try {
      if (paying) return
      setPaying(true)

      // 1️⃣ PREPARE ORDER
      const orderRes = await fetch(
        'http://localhost:8082/v1/orders/prepare',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'X-SESSION-ID': getOrCreateSessionId(),
          },
        }
      )
      
      if (!orderRes.ok) {
        throw new Error('Order prepare failed')
      }

      const order = await orderRes.json()

      // 2️⃣ CREATE PAYMENT INTENT
      const payRes = await fetch(
        'http://localhost:8083/v1/payments/intent',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: order.order_id,
            amount_cents: order.amount_cents,
            currency: order.currency,
          }),
        }
      )
      console.log(payRes)
      if (!payRes.ok) {
        throw new Error('Payment intent failed')
      }

      const payment = await payRes.json()

      // Attach order id for mock flow
      payment.order_id = order.order_id

      // 3️⃣ OPEN GATEWAY
      await openGateway(payment)
    } catch (err) {
      console.error(err)
      alert('Checkout failed')
    } finally {
      setPaying(false)
    }
  }

  /**
   * LOAD CART
   */
  useEffect(() => {
    async function load() {
      try {
        const data = await getCart()
        setCart(data)
      } catch (e) {
        console.error(e)
        setCart({ items: [], subtotal: 0 })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ⏳ Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
           <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
           <p className="text-sm text-gray-500 font-medium">Securing checkout...</p>
        </div>
     </div>
    )
  }

  // ✅ Normalize safely
  const items = Array.isArray(cart?.items) ? cart.items : []

  // 🧺 Empty cart
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm max-w-md w-full">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
             <ShoppingBag className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-500 mb-6">Add some beautiful sarees to proceed.</p>
          <Link href="/" className="block w-full bg-black text-white py-3 rounded font-medium">
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  // 🧾 Checkout UI
  return (
    <div className="min-h-screen bg-[#f1f3f6] pb-20">
      
      {/* Checkout Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <span className="text-xl font-serif font-bold text-gray-900">Sabhyatam</span>
             <span className="text-gray-300">|</span>
             <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Secure Checkout</span>
           </div>
           <div className="flex items-center gap-1 text-green-700 bg-green-50 px-3 py-1 rounded-full text-xs font-bold">
              <ShieldCheck className="h-4 w-4" /> 100% SECURE
           </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          
          {/* LEFT COLUMN: Steps */}
          <div className="space-y-4">
            
            {/* 1. Login (Completed Mock) */}
            <div className="bg-white p-4 rounded-sm shadow-sm flex items-center justify-between">
               <div className="flex gap-4">
                 <span className="bg-gray-200 text-gray-600 px-2 py-0.5 text-xs font-bold rounded h-fit">1</span>
                 <div>
                   <h3 className="text-gray-500 font-bold text-sm uppercase">Login</h3>
                   <p className="text-sm font-medium text-black">+91 98765 43210 <span className="text-gray-500 font-normal ml-2">Logged in</span></p>
                 </div>
               </div>
               <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>

            {/* 2. Address (Static Mock for MVP) */}
            <div className="bg-white p-6 rounded-sm shadow-sm">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex gap-4">
                    <span className="bg-black text-white px-2 py-0.5 text-xs font-bold rounded h-fit">2</span>
                    <h3 className="text-black font-bold text-sm uppercase">Delivery Address</h3>
                 </div>
                 <button className="text-blue-600 text-xs font-bold uppercase hover:underline">Change</button>
               </div>
               
               <div className="ml-10 p-4 border border-blue-100 bg-blue-50/50 rounded-lg">
                  <div className="flex items-start gap-3">
                     <MapPin className="h-5 w-5 text-black shrink-0 mt-0.5" />
                     <div>
                        <p className="font-bold text-sm text-gray-900">Default Address <span className="ml-2 bg-gray-200 text-gray-600 text-[10px] px-1 rounded">HOME</span></p>
                        <p className="text-sm text-gray-700 mt-1">123, Silk Weaver&apos;s Lane, Near Handloom Park,</p>
                        <p className="text-sm text-gray-700">Kanchipuram, Tamil Nadu - 631501</p>
                        <p className="text-sm text-gray-700 mt-2 font-medium">Mobile: <span className="font-bold">9876543210</span></p>
                     </div>
                  </div>
                  <button className="mt-4 ml-8 bg-blue-600 text-white text-sm font-bold px-6 py-2 rounded shadow-sm hover:bg-blue-700 transition">
                     DELIVER HERE
                  </button>
               </div>
            </div>

            {/* 3. Order Summary */}
            <div className="bg-white p-6 rounded-sm shadow-sm">
               <div className="flex gap-4 mb-4">
                  <span className="bg-black text-white px-2 py-0.5 text-xs font-bold rounded h-fit">3</span>
                  <h3 className="text-black font-bold text-sm uppercase">Order Summary</h3>
               </div>

               <div className="ml-10 space-y-4">
                  {items.map((item: any) => (
                    // FIX: Use item.product.id instead of item.variant.id
                    <div key={item.product.id} className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                       <div className="h-20 w-16 bg-gray-100 rounded shrink-0 overflow-hidden border border-gray-200">
                          {/* FIX: Use real image URL from item.product.image */}
                          <img 
                            src={item.product.image || "/placeholder.svg"} 
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                       </div>
                       <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{item.product.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                          <div className="mt-2 flex items-center gap-2">
                             {/* FIX: Display correct pricing (paise -> rupees) */}
                             <span className="font-bold text-gray-900">₹{(item.line_total / 100).toLocaleString('en-IN')}</span>
                             {/* Mock struck price logic */}
                             <span className="text-xs text-gray-400 line-through">₹{((item.line_total / 100) * 1.25).toFixed(0)}</span>
                             <span className="text-xs text-green-600 font-bold">20% Off</span>
                          </div>
                       </div>
                       <div className="text-xs text-gray-500">
                          Delivery by <span className="font-bold text-black">Wed, 24th</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* 4. Payment Options */}
            <div className="bg-white p-6 rounded-sm shadow-sm">
                <div className="flex gap-4">
                  <span className="bg-black text-white px-2 py-0.5 text-xs font-bold rounded h-fit">4</span>
                  <h3 className="text-black font-bold text-sm uppercase">Payment Options</h3>
               </div>
               <div className="ml-10 mt-4">
                  <div className="flex items-center gap-3 p-4 border border-green-200 bg-green-50 rounded-lg">
                     <div className="p-2 bg-white rounded-full text-green-600">
                        <CreditCard className="h-5 w-5" />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-gray-900">Razorpay / UPI / Cards</p>
                        <p className="text-xs text-gray-600">Secure payment gateway</p>
                     </div>
                     <CheckCircle2 className="h-5 w-5 text-green-600 ml-auto" />
                  </div>
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Price Sticky */}
          <div className="lg:sticky lg:top-24 h-fit space-y-4">
            
            <div className="bg-white p-5 rounded-sm shadow-sm">
              <h2 className="text-gray-500 font-bold text-xs uppercase tracking-wider border-b border-gray-100 pb-3 mb-3">
                Price Details
              </h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price ({items.length} items)</span>
                  {/* FIX: Price logic */}
                  <span className="font-medium">₹{(cart.subtotal / 100 * 1.25).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-gray-600">Discount</span>
                   <span className="text-green-600">- ₹{(cart.subtotal / 100 * 0.25).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-gray-600">Delivery Charges</span>
                   <span className="text-green-600 flex items-center gap-1">
                      <span className="text-gray-400 line-through text-xs">₹99</span> FREE
                   </span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 my-4 pt-4">
                 <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                    <span>Total Amount</span>
                    <span>₹{(cart.subtotal / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                 </div>
              </div>

              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full bg-[#fb641b] hover:bg-[#f06018] text-white py-4 font-bold rounded shadow-md transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {paying ? (
                   <>Processing <span className="animate-pulse">...</span></>
                ) : (
                   <>PAY ₹{(cart.subtotal / 100).toFixed(0)} <ArrowRight className="h-4 w-4" /></>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-gray-400">
                <Lock className="h-3 w-3" />
                Payments are SSL encrypted and secured
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
               <div className="bg-white p-3 rounded shadow-sm text-center">
                  <ShieldCheck className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-500 font-medium">Genuine Products</p>
               </div>
               <div className="bg-white p-3 rounded shadow-sm text-center">
                  <Truck className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-500 font-medium">Fast Delivery</p>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}