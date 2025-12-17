export const CART_UPDATED_EVENT = "cart-updated"

export function emitCartUpdated() {
  window.dispatchEvent(new Event(CART_UPDATED_EVENT))
}
