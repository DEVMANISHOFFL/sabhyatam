"use client";

import { useEffect, useState } from "react";
import { Check, X, Star, Loader2, AlertCircle } from "lucide-react";
// Import the functions we created in lib/admin-api
import { adminGetPendingReviews, adminApproveReview, AdminReview } from "@/lib/admin-api";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1. Fetch Pending Reviews on Mount
  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    try {
      const data = await adminGetPendingReviews();
      setReviews(data || []);
      setError("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not load reviews. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  // 2. Approve Handler
  const handleApprove = async (id: string) => {
    // Optimistic UI update: Remove it from the list immediately
    const previousReviews = [...reviews];
    setReviews((prev) => prev.filter((r) => r.ID !== id));

    try {
      await adminApproveReview(id);
      // Success!
    } catch (err) {
      console.error(err);
      alert("Failed to approve review");
      // Revert if failed
      setReviews(previousReviews);
    }
  };

  // 3. Reject Handler (Placeholder)
  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this review?")) return;
    alert("Reject API not connected yet!");
  };

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center gap-2 text-gray-500">
        <Loader2 className="animate-spin w-5 h-5" /> Loading reviews...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-red-600 flex items-center gap-2 bg-red-50 rounded-lg m-10 border border-red-100">
        <AlertCircle className="w-5 h-5" /> {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900">Review Moderation</h1>
        <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200">
          {reviews.length} Pending
        </span>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">No pending reviews to moderate.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <div
              key={review.ID}
              className="group bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex text-yellow-400 gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i <= review.Rating ? "fill-current" : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-gray-900">{review.Title}</span>
                </div>

                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  {review.Body}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 font-mono">
                  <span>ID: {review.ID.slice(0, 8)}...</span>
                  <span>•</span>
                  <span>User: {review.UserID.slice(0, 8)}...</span>
                  <span>•</span>
                  <span>
                    {new Date(review.CreatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex sm:flex-col gap-2 justify-center border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-4">
                <button
                  onClick={() => handleApprove(review.ID)}
                  className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition active:scale-95"
                  title="Approve Review"
                >
                  <Check className="w-4 h-4" /> Approve
                </button>

                <button
                  onClick={() => handleReject(review.ID)}
                  className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition active:scale-95"
                  title="Reject Review"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}