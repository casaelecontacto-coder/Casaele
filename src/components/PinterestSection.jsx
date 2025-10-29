import React, { useState, useEffect } from 'react';
import { FiExternalLink, FiRefreshCw } from 'react-icons/fi';

export default function PinterestSection({ type, limit = 6 }) {
  const [pinterestData, setPinterestData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPinterestData();
  }, [type]);

  const fetchPinterestData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await fetch('/api/pinterest', { headers });
      const result = await response.json();
      
      if (result.success) {
        let filteredData = result.data;
        
        // Filter by type if specified
        if (type) {
          filteredData = result.data.filter(item => item.type === type);
        }
        
        // Limit results
        if (limit) {
          filteredData = filteredData.slice(0, limit);
        }
        
        setPinterestData(filteredData);
      } else {
        setError('Failed to load Pinterest content');
      }
    } catch (err) {
      setError('Failed to load Pinterest content');
    } finally {
      setLoading(false);
    }
  };

  const PinterestCard = ({ item }) => {
    const [embedLoaded, setEmbedLoaded] = useState(false);

    useEffect(() => {
      // Load Pinterest script if not already loaded
      if (!window.PinUtils) {
        const script = document.createElement('script');
        script.src = '//assets.pinterest.com/js/pinit.js';
        script.async = true;
        script.defer = true;
        script.onload = () => setEmbedLoaded(true);
        document.head.appendChild(script);
      } else {
        setEmbedLoaded(true);
      }
    }, []);

    return (
      <div className="group relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        {/* Image */}
        {item.imageUrl && (
          <div className="relative overflow-hidden">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-800 backdrop-blur-sm">
                {item.type}
              </span>
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight flex-1 group-hover:text-red-600 transition-colors">
              {item.title}
            </h3>
          </div>
          
          {item.description && (
            <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed mb-4">
              {item.description}
            </p>
          )}
          
          {/* Pinterest Embed */}
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              Pinterest Embed
            </div>
            <div 
              className="w-full min-h-[200px] bg-gray-50 rounded-lg border border-gray-200 p-4"
              dangerouslySetInnerHTML={{ __html: item.embedCode }}
            />
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500 font-medium">
              {new Date(item.createdAt).toLocaleDateString()}
            </div>
            {item.sourceUrl && (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
              >
                <FiExternalLink className="w-4 h-4" />
                View on Pinterest
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-gray-500">
          <FiRefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading Pinterest content...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">{error}</div>
        <button
          onClick={fetchPinterestData}
          className="text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (pinterestData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No Pinterest content available
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {type ? `${type.charAt(0).toUpperCase() + type.slice(1)} Collection` : 'Pinterest Collection'}
          </h2>
          <p className="text-gray-600 mt-1">
            {pinterestData.length} {pinterestData.length === 1 ? 'item' : 'items'} available
          </p>
        </div>
        <button
          onClick={fetchPinterestData}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {pinterestData.map((item) => (
          <PinterestCard key={item._id} item={item} />
        ))}
      </div>
    </div>
  );
}
