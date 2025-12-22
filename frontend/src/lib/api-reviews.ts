// Types matching your Go structs
export type Review = {
  ID: string
  UserID: string
  Rating: number
  Title: string
  Body: string
  Status: string
  CreatedAt: string
}

export type RatingSummary = {
  average: number
  count: number
}

// Fetch list of approved reviews
export async function fetchProductReviews(productId: string): Promise<Review[]> {
  const res = await fetch(`/api/reviews/v1/products/${productId}/reviews`, {
    cache: "no-store"
  });
  
  if (!res.ok) return [];

  const data = await res.json();
  // ✅ FIX: Fallback to [] if data is null
  return data || []; 
}

// Fetch rating stats
export async function fetchRatingSummary(productId: string): Promise<RatingSummary> {
  // Proxy: /api/reviews/v1/... -> Go: /v1/...
  const res = await fetch(`/api/reviews/v1/products/${productId}/rating-summary`, {
    cache: "no-store"
  });
  if (!res.ok) return { average: 0, count: 0 };
  return res.json();
}

// Submit a new review
export async function submitReview(
  token: string, 
  data: { 
    product_id: string; 
    order_item_id: string; 
    rating: number; 
    title: string; 
    body: string 
  }
) {
  // Proxy: /api/reviews/reviews -> Go: /reviews
  const res = await fetch(`/api/reviews/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  // ✅ VALID CHANGE: Handle text errors (e.g. "review already exists")
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Failed to submit review");
  }

  // Go backend returns 201 Created with no body or empty JSON, 
  // so we safely return true or an empty object.
  return {}; 
}