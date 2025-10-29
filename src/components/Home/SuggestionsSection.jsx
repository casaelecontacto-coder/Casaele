import React, { useState } from "react";
import { apiSend } from "../../utils/api";

function SuggestionsSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    suggestion: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        message: formData.suggestion,
      };
      await apiSend('/api/suggestions/add', 'POST', payload);
      setSuccess('Thank you! Your suggestion has been submitted for review.');
      setFormData({
        name: '',
        email: '',
        suggestion: '',
      });
    } catch (err) {
      console.error("Failed to submit suggestion:", err);
      setError(err.message || 'Failed to submit suggestion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="suggestions-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <h1 className="text-center font-bold text-black text-2xl sm:text-3xl md:text-4xl mb-10 md:mb-12">
        Share Your Ideas
      </h1>
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
              Help Us Improve CasaDeEle
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Have an idea for a new feature, content, or improvement? We'd love to hear from you! 
              Your suggestions help us make CasaDeEle even better for everyone.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Email *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Suggestion *</label>
              <textarea
                name="suggestion"
                placeholder="Share your ideas, suggestions, or feedback about CasaDeEle. What would you like to see improved or added?"
                value={formData.suggestion}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={loading}
                className="bg-red-700 hover:bg-red-800 text-white font-semibold px-8 py-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Suggestion'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SuggestionsSection;
