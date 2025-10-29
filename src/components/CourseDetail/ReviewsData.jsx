import React, { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import { apiGet, apiSend } from "../../utils/api";

// Star rating component
const StarRating = ({ rating, setRating }) => {
  return (
    <div className="flex space-x-1">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        return (
          <FaStar
            key={starValue}
            size={24}
            onClick={() => setRating(starValue)}
            onMouseOver={() => setRating(starValue)}
            color={starValue <= rating ? "#ffc107" : "#e4e5e9"}
            className="cursor-pointer"
          />
        );
      })}
    </div>
  );
};

// Main Reviews component
function Reviews({ courseId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch approved reviews for this course
  useEffect(() => {
    if (courseId) {
      setLoading(true);
      apiGet(`/api/reviews/approved/${courseId}`)
        .then(setReviews)
        .catch(err => console.error("Failed to fetch reviews", err))
        .finally(() => setLoading(false));
    }
  }, [courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || !name.trim() || !comment.trim()) {
      setError("Please provide a name, rating, and comment.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        course: courseId,
        name,
        rating,
        comment
      };
      const response = await apiSend('/api/reviews', 'POST', payload);
      
      // Show success message and reset form
      setSuccess(response.message || 'Your review has been submitted for approval!');
      setName("");
      setComment("");
      setRating(0);
    } catch (err) {
      setError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full mt-12 pt-8 border-t border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Review List */}
        <div>
          <h2 className="text-2xl font-bold mb-6">All Reviews</h2>
          {loading && <p>Loading reviews...</p>}
          
          {!loading && reviews.length === 0 && (
            <p className="text-gray-600">No reviews yet. Be the first to leave one!</p>
          )}

          {!loading && reviews.length > 0 && (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review._id} className="border-b border-gray-100 pb-4">
                  <div className="flex items-center mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} color={i < review.rating ? "#ffc107" : "#e4e5e9"} />
                      ))}
                    </div>
                    <span className="ml-3 font-semibold text-gray-800">{review.name}</span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Form */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Leave a Review</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
              <StarRating rating={rating} setRating={setRating} />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                Your Review
              </label>
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
              />
            </div>
            
            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Reviews;