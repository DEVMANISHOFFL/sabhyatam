'use client'

import { useEffect, useState } from 'react'
import { getCart } from '@/lib/cart'
import { getOrCreateSessionId } from '@/lib/session'
import { useRouter } from 'next/navigation'

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
    return <div className="p-6">Loading checkout…</div>
  }

  // ✅ Normalize safely
  const items = Array.isArray(cart?.items) ? cart.items : []

  // 🧺 Empty cart
  if (items.length === 0) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-xl font-semibold">Checkout</h1>
        <p className="mt-4">Your cart is empty.</p>
      </div>
    )
  }

  // 🧾 Checkout UI
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>

      {items.map((item: any) => (
        <div
          key={item.variant.id}
          className="flex justify-between py-2 border-b"
        >
          <span>{item.product.title}</span>
          {/* cents → rupees */}
          <span>₹{(item.line_total / 100).toFixed(2)}</span>
        </div>
      ))}

      <div className="flex justify-between mt-6 font-semibold text-lg">
        <span>Total</span>
        <span>₹{(cart.subtotal / 100).toFixed(2)}</span>
      </div>

      <button
        onClick={handlePay}
        disabled={paying}
        className="mt-6 w-full bg-black text-white py-3 rounded disabled:opacity-60"
      >
        {paying ? 'Processing…' : 'Pay Now'}
      </button>
    </div>
  )
}
