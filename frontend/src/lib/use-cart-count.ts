"use client"

import { useEffect, useState } from "react"
import { getCart } from "@/lib/cart"
import { CART_UPDATED_EVENT } from "@/lib/cart-events"

export function useCartCount() {
  const [count, setCount] = useState(0)

  async function load() {
    try {
      const cart = await getCart()
      const totalQty = cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      )
      setCount(totalQty)
    } catch {
      // cart not ready yet — fine for header
      setCount(0)
    }
  }

  useEffect(() => {
    load()

    window.addEventListener(CART_UPDATED_EVENT, load)
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, load)
    }
  }, [])

  return count
}
    