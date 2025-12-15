'use client'

import { useRouter } from 'next/navigation'

export default function OrderFailedPage() {
  const router = useRouter()

  return (
    <div className="max-w-xl mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold text-red-600">Payment Failed ❌</h1>
      <p className="mt-4">
        Something went wrong while processing your order.
      </p>

      <button
        onClick={() => router.push('/checkout')}
        className="mt-6 bg-black text-white px-6 py-3 rounded"
      >
        Try Again
      </button>
    </div>
  )
}
