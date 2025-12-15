'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('order_id')

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Prevent strict-mode double polling explosion
  const pollingRef = useRef(false)

  useEffect(() => {
    if (!orderId || pollingRef.current) return
    pollingRef.current = true

    let attempts = 0
    const MAX_ATTEMPTS = 10

    const poll = async () => {
      try {
        const res = await fetch(
          `http://localhost:8082/v1/orders/${orderId}/public`,
          { cache: 'no-store' }
        )

        // Order not visible yet → keep polling
        if (res.status === 404) {
          attempts++
          if (attempts < MAX_ATTEMPTS) {
            setTimeout(poll, 1500)
            return
          }
          router.replace('/order/failed')
          return
        }
await fetch('http://localhost:8083/v1/payments/mock-success', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orderId }),
})

        const data = await res.json()

        if (data.status === 'pending_payment') {
          setTimeout(poll, 1500)
          return
        }

        if (data.status !== 'paid') {
          router.replace('/order/failed')
          return
        }

        setOrder(data)
        setLoading(false)
      } catch (err) {
        console.error(err)
        router.replace('/order/failed')
      }
    }

    poll()
  }, [orderId, router])

  if (loading) {
    return <div className="p-6 text-center">Finalizing your order…</div>
  }

  return (
    <div className="max-w-xl mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold">Order Successful 🎉</h1>
      <p className="mt-2 text-gray-600">Payment confirmed</p>

      <p className="mt-4 text-sm">
        Order ID: <span className="font-mono">{order.id}</span>
      </p>

      <button
        onClick={() => router.push('/')}
        className="mt-8 bg-black text-white px-6 py-3 rounded"
      >
        Continue Shopping
      </button>
    </div>
  )
}
