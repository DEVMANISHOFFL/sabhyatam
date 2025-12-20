'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ShieldCheck, 
  MapPin, 
  CheckCircle2, 
  CreditCard,
  Lock,
  ArrowRight,
  ShoppingBag,
  Truck,
  Loader2
} from 'lucide-react'

import { useAuth } from '../context/auth-context'
import { getCart } from '@/lib/cart'

export default function CheckoutPage() {
  const [cart, setCart] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const router = useRouter()
  
  const { user, token, isLoading: authLoading } = useAuth()

  // --- 1. MOCK GATEWAY SIMULATION ---
  async function openGateway(payment: any) {
    // Simulate gateway delay
    await new Promise(r => setTimeout(r, 1500))

    // Call Mock Success Endpoint on Port 8083
    const res = await fetch(
      'http://localhost:8083/v1/payments/mock-success',
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`, 
          "X-USER-ID": user?.id || "", 
        },
        body: JSON.stringify({
          order_id: payment.order_id,
        }),
      }
    )

    if (!res.ok) throw new Error('Mock payment failed')
    
    // Redirect to Success Page
    router.push(`/order/success?order_id=${payment.order_id}`)
  }

  // --- 2. MAIN PAYMENT HANDLER ---
  async function handlePay() {
    try {
      if (paying) return

      if (!user || !token) {
        alert("Please login to complete your purchase.")
        router.push("/login")
        return
      }

      setPaying(true)

      // A. PREPARE ORDER (Orders Service: Port 8082)
      const orderRes = await fetch(
        'http://localhost:8082/v1/orders/prepare',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-USER-ID': user.id,
            // Use the correct key that matches cart.ts
            'X-SESSION-ID': localStorage.getItem("sabhyatam_session") || "", 
          },
          body: JSON.stringify({
            shipping_address: {
              line1: "123, Silk Weaver's Lane, Near Handloom Park",
              city: "Kanchipuram",
              state: "Tamil Nadu",
              postal_code: "631501",
              country: "IN",
              phone: user.user_metadata?.phone || "9876543210" 
            }
          })
        }
      )
      
      if (!orderRes.ok) {
        const errJson = await orderRes.json().catch(() => ({}))
        throw new Error(errJson.error || 'Order prepare failed')
      }

      const order = await orderRes.json()

      // B. CREATE PAYMENT INTENT (Payments Service: Port 8083)
      const payRes = await fetch(
        'http://localhost:8083/v1/payments/intent', // Corrected Port: 8083
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-USER-ID': user.id 
          },
          body: JSON.stringify({
            order_id: order.order_id,
            amount_cents: order.amount_cents,
            currency: order.currency,
          }),
        }
      )
      
      if (!payRes.ok) throw new Error('Payment intent failed')

      const payment = await payRes.json()
      payment.order_id = order.order_id

      // C. OPEN GATEWAY
      await openGateway(payment)

    } catch (err: any) {
      console.error("Checkout Error:", err)
      alert(`Checkout failed: ${err.message}`)
    } finally {
      setPaying(false)
    }
  }

  // --- 3. LOAD CART ---
  useEffect(() => {
    async function load() {
      try {
        const data = await getCart()
        setCart(data)
      } catch (e) {
        setCart({ items: [], subtotal: 0 })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // --- 4. RENDER LOADING ---
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#111217] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
           <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
           <p className="text-sm text-gray-400 font-medium">Loading secure checkout...</p>
        </div>
     </div>
    )
  }

  // --- 5. RENDER EMPTY CART ---
  const items = Array.isArray(cart?.items) ? cart.items : []

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center bg-white p-10 rounded-2xl shadow-sm max-w-md w-full">
          <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cart is empty</h1>
          <p className="text-gray-500 mb-8">Add some beautiful sarees to proceed.</p>
          <Link href="/" className="block w-full bg-blue-600 text-white py-4 rounded-xl font-bold transition hover:bg-blue-700">
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  // --- 6. RENDER CHECKOUT UI ---
  return (
    <div className="min-h-screen bg-[#f1f3f6] pb-20">
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Link href="/" className="text-xl font-serif font-bold text-gray-900">Sabhyatam</Link>
             <span className="text-gray-300">|</span>
             <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Secure Checkout</span>
           </div>
           <div className="flex items-center gap-1 text-green-700 bg-green-50 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
              <ShieldCheck className="h-4 w-4" /> 100% SECURE
           </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          
          {/* LEFT COLUMN */}
          <div className="space-y-4">
            
            {/* Step 1: Login Status */}
            <div className="bg-white p-5 rounded-sm shadow-sm flex items-center justify-between">
               <div className="flex gap-4 items-center">
                 <span className="bg-blue-600 text-white w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded">1</span>
                 <div>
                   <h3 className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Account</h3>
                   {user ? (
                     <p className="text-sm font-bold text-black">
                       {user.user_metadata?.full_name || user.email} <span className="text-gray-500 font-normal ml-1">({user.email})</span>
                     </p>
                   ) : (
                     <p className="text-sm text-red-500 font-medium">Not logged in</p>
                   )}
                 </div>
               </div>
               {user ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
               ) : (
                  <Link href="/login" className="text-blue-600 text-sm font-bold border border-blue-600 px-4 py-1 rounded hover:bg-blue-50">
                    LOGIN
                  </Link>
               )}
            </div>

            {/* Step 2: Address */}
            <div className="bg-white p-6 rounded-sm shadow-sm">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex gap-4">
                    <span className="bg-blue-600 text-white w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded">2</span>
                    <h3 className="text-black font-bold text-sm uppercase">Delivery Address</h3>
                 </div>
               </div>
               
               <div className="ml-10 p-5 border border-blue-100 bg-blue-50/50 rounded-xl">
                  <div className="flex items-start gap-3">
                     <MapPin className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                     <div className="text-sm">
                        <p className="font-bold text-gray-900">{user?.user_metadata?.full_name || "Guest"}</p>
                        <p className="text-gray-600 mt-1">123, Silk Weaver's Lane, Kanchipuram, TN - 631501</p>
                        <p className="text-gray-900 mt-2 font-bold uppercase text-[10px] tracking-widest text-blue-700">
                          Mobile: {user?.user_metadata?.phone || "N/A"}
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Step 3: Order Summary */}
            <div className="bg-white p-6 rounded-sm shadow-sm">
               <div className="flex gap-4 mb-4">
                  <span className="bg-blue-600 text-white w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded">3</span>
                  <h3 className="text-black font-bold text-sm uppercase">Order Summary</h3>
               </div>

               <div className="ml-10 space-y-4">
                  {items.map((item: any) => (
                    <div key={item.product.id} className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                       <div className="h-20 w-16 bg-gray-100 rounded shrink-0 overflow-hidden border border-gray-200 relative">
                          {item.product.image && (
                            <img 
                                src={item.product.image} 
                                alt={item.product.title}
                                className="w-full h-full object-cover"
                            />
                          )}
                       </div>
                       <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{item.product.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                          <div className="mt-2 flex items-center gap-2">
                             <span className="font-bold text-gray-900">₹{(item.line_total / 100).toLocaleString('en-IN')}</span>
                             <span className="text-xs text-gray-400 line-through">₹{Math.floor((item.line_total / 100) * 1.25)}</span>
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

            {/* Step 4: Payment Options */}
            <div className="bg-white p-6 rounded-sm shadow-sm">
                <div className="flex gap-4">
                  <span className="bg-blue-600 text-white w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded">4</span>
                  <h3 className="text-black font-bold text-sm uppercase">Payment Options</h3>
               </div>
               <div className="ml-10 mt-4">
                  <div className="flex items-center gap-3 p-4 border-2 border-blue-500 bg-blue-50/30 rounded-xl">
                     <CreditCard className="h-5 w-5 text-blue-600" />
                     <span className="text-sm font-bold text-gray-900">Razorpay / UPI / Cards</span>
                     <CheckCircle2 className="h-5 w-5 text-blue-600 ml-auto" />
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
                disabled={paying || !user}
                className={`w-full text-white py-4 font-bold rounded shadow-md transition flex items-center justify-center gap-2
                  ${paying || !user 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#fb641b] hover:bg-[#f06018]'
                  }
                `}
              >
                {!user ? (
                  "Login to Continue"
                ) : paying ? (
                  <>Processing <Loader2 className="animate-spin h-4 w-4" /></>
                ) : (
                  <>PAY ₹{(cart.subtotal / 100).toFixed(0)} <ArrowRight className="h-4 w-4" /></>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-gray-400">
                <Lock className="h-3 w-3" />
                Payments are SSL encrypted and secured
              </div>
            </div>
            
            {/* Trust Badges */}
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