import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '../../utils/api';
import { FaCheck, FaTimes, FaTrash } from 'react-icons/fa';

export default function ReviewsManager() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = () => {
    setLoading(true);
    apiGet('/api/reviews')
      .then(setReviews)
      .catch((err) => {
        console.error("Failed to fetch reviews:", err);
        alert('Failed to fetch reviews.');
      })
      .finally(() => setLoading(false));
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const updatedReview = await apiSend(`/api/reviews/${id}`, 'PUT', { status });
      setReviews(reviews.map(r => (r._id === id ? updatedReview : r)));
    } catch (err) {
      console.error(`Failed to ${status} review:`, err);
      alert(`Failed to ${status} review.`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review permanently?')) {
      return;
    }
    try {
      await apiSend(`/api/reviews/${id}`, 'DELETE');
      setReviews(reviews.filter(r => r._id !== id));
    } catch (err) {
      console.error("Failed to delete review:", err);
      alert('Failed to delete review.');
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reviews Manager</h1>
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-3 border-b flex justify-between items-center">
          <div className="text-sm text-gray-600">Manage course reviews</div>
          <button
            onClick={fetchReviews}
            disabled={loading}
            className="px-3 py-1.5 rounded-md bg-red-700 text-white hover:bg-red-800 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading reviews...</div>
        ) : (
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Comment</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reviews.map((review) => (
                <tr key={review._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{review.name}</td>
                  <td className="px-4 py-3 text-gray-700">{review.rating} ★</td>
                  <td className="px-4 py-3 text-gray-700 max-w-sm truncate">{review.comment}</td>
                  <td className="px-4 py-3 text-gray-700">{review.course?.title || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusChip(review.status)}`}>
                      {review.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    {review.status !== 'approved' && (
                      <button
                        onClick={() => handleUpdateStatus(review._id, 'approved')}
                        title="Approve"
                        className="p-2 rounded bg-green-50 text-green-700 hover:bg-green-100 transition"
                      >
                        <FaCheck />
                      </button>
                    )}
                    {review.status !== 'rejected' && (
                      <button
                        onClick={() => handleUpdateStatus(review._id, 'rejected')}
                        title="Reject"
                        className="p-2 rounded bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition"
                      >
                        <FaTimes />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(review._id)}
                      title="Delete"
                      className="p-2 rounded bg-red-50 text-red-700 hover:bg-red-100 transition"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}