"use client";

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from "react";
import { Star, User, CheckCircle2, PenLine } from "lucide-react";
import { useAuth } from "@/app/context/auth-context";
import { Review, RatingSummary, fetchProductReviews, fetchRatingSummary, submitReview } from "@/lib/api-reviews";

// --- SUB-COMPONENT: RATING SUMMARY ---
function SummaryCard({ summary }: { summary: RatingSummary }) {
  return (
    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 h-fit">
      <h3 className="text-lg font-serif font-bold text-gray-900 mb-4">Customer Reviews</h3>
      <div className="flex items-end gap-3 mb-2">
        <span className="text-5xl font-bold text-gray-900">{summary.average}</span>
        <div className="mb-2">
          <div className="flex text-yellow-500 gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className={`w-5 h-5 ${i <= Math.round(summary.average) ? "fill-current" : "text-gray-300"}`} />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">{summary.count} Verified Ratings</p>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: WRITE REVIEW FORM ---
function WriteReviewForm({ 
  productId, 
  onSuccess, 
  onCancel 
}: { 
  productId: string, 
  onSuccess: () => void, 
  onCancel: () => void 
}) {
  const { user } = useAuth(); 
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderItemId, setOrderItemId] = useState(""); 
  
  // Initialize Supabase Client
  const [supabase] = useState(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      // 1. Fetch the fresh session directly from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error("You must be logged in to submit a review.");
      }

      // 2. Use the retrieved access_token for the backend call
      await submitReview(session.access_token, {
        product_id: productId,
        order_item_id: orderItemId,
        rating,
        title,
        body
      });

      alert("Review submitted for approval!");
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm mt-6 animate-in fade-in slide-in-from-top-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-gray-900">Write a Review</h4>
        <button type="button" onClick={onCancel} className="text-xs text-gray-500 hover:text-black">Cancel</button>
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-400 uppercase font-bold">Order Item ID (Verification)</label>
        <input 
          type="text" 
          value={orderItemId} 
          onChange={(e) => setOrderItemId(e.target.value)} 
          className="w-full text-xs border border-gray-300 rounded p-2 mt-1" 
          placeholder="Paste your order_item_id here"
          required
        />
      </div>

      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= (hoverRating || rating) ? "text-yellow-400 fill-current" : "text-gray-200"
              }`}
            />
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Review Title"
        className="w-full text-sm border-b border-gray-200 py-2 mb-4 focus:border-black outline-none font-bold"
        required
      />

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share your experience..."
        className="w-full text-sm border border-gray-200 rounded-lg p-3 mb-4 focus:border-black outline-none min-h-[100px]"
        required
      />

      <button
        disabled={loading}
        className="w-full bg-black text-white font-bold uppercase text-xs py-3 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}

// --- MAIN COMPONENT ---
export default function ReviewsSection({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<RatingSummary>({ average: 0, count: 0 });
  const [showForm, setShowForm] = useState(false);

  // Initial Fetch
  const refreshData = () => {
    fetchProductReviews(productId).then(setReviews);
    fetchRatingSummary(productId).then(setSummary);
    setShowForm(false);
  };

  useEffect(() => {
    refreshData();
  }, [productId]);

  return (
    <div id="reviews-section" className="border-t border-gray-100 pt-16 mt-16 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-12">
        
        {/* Left: Summary & CTA */}
        <div className="w-full lg:w-1/3 space-y-6">
          <SummaryCard summary={summary} />
          
          {!showForm && (
            <div className="text-center lg:text-left">
              <p className="text-sm text-gray-500 mb-4">Own this product? Share your thoughts.</p>
              <button 
                onClick={() => user ? setShowForm(true) : alert("Please login first")}
                className="inline-flex items-center gap-2 border border-gray-300 px-6 py-3 rounded-full text-sm font-bold text-gray-900 hover:border-black hover:bg-gray-50 transition"
              >
                <PenLine className="w-4 h-4" /> Write a Review
              </button>
            </div>
          )}

          {showForm && (
            <WriteReviewForm 
              productId={productId} 
              onSuccess={refreshData} 
              onCancel={() => setShowForm(false)} 
            />
          )}
        </div>

        {/* Right: Review List */}
        <div className="flex-1">
          <h3 className="text-xl font-serif font-bold text-gray-900 mb-6">
            Reviews ({reviews.length})
          </h3>

          <div className="space-y-8">
            {reviews.length === 0 ? (
              <p className="text-gray-400 italic">No reviews yet. Be the first!</p>
            ) : (
              reviews.map((review) => (
                <div key={review.ID} className="border-b border-gray-100 pb-8 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="font-bold text-sm text-gray-900">Verified Buyer</span>
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.CreatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex text-yellow-500 mb-2 gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i <= review.Rating ? "fill-current" : "text-gray-200"}`} />
                    ))}
                  </div>

                  <h4 className="font-bold text-sm text-gray-900 mb-1">{review.Title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{review.Body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}