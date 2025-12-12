import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useApiCache } from '../context/ApiCacheContext';

function CmsPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { fetchCached, getCached } = useApiCache();
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate fetches
    if (fetchedRef.current) {
      return;
    }

    const fetchPage = async () => {
      fetchedRef.current = true;
      setLoading(true);
      setError('');
      const endpoint = `/api/cms/slug/${slug}`;
      
      try {
        // Check cache first
        const cached = getCached(endpoint);
        if (cached && cached.data) {
          setPage(cached.data);
          setLoading(false);
          return;
        }

        // Fetch using cache
        const result = await fetchCached(endpoint);
        if (result.data) {
          setPage(result.data);
        } else {
          throw result.error || new Error('Page not found');
        }
      } catch (err) {
        console.error('❌ Error fetching CMS page:', err);
        setError('Page not found. Please check the URL and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug, fetchCached, getCached]); // This will re-run whenever the slug in the URL changes

  if (loading) {
    return <div className="text-center p-20 font-semibold">Loading Page...</div>;
  }

  if (error) {
    return <div className="text-center p-20 text-red-600">{error}</div>;
  }

  // Debug logging
  ('🎨 Rendering CMS page:', {
    hasEmbed: !!page.secondSectionEmbed,
    embedTitle: page.secondSectionEmbed?.title,
    embedCodeLength: page.secondSectionEmbed?.embedCode?.length,
    hasImage: !!page.imageUrl,
    imageUrl: page.imageUrl
  });

  // Temporary debug display
  if (page.secondSectionEmbed) {
    ('✅ Embed Data Structure:', {
      title: page.secondSectionEmbed.title,
      type: page.secondSectionEmbed.type,
      embedCode: page.secondSectionEmbed.embedCode?.substring(0, 100) + '...'
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 border-b pb-4">
          {page.title}
        </h1>
        
        {/* Render Embed if selected, otherwise render image if available */}
        {page.secondSectionEmbed ? (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">📦 Rendering H5P Embed: {page.secondSectionEmbed.title}</p>
            <div 
              className="w-full max-w-4xl mx-auto aspect-video border rounded-lg overflow-hidden shadow-sm"
              dangerouslySetInnerHTML={{ __html: page.secondSectionEmbed.embedCode }} 
            />
          </div>
        ) : page.imageUrl ? (
          <div className="mb-6 flex justify-center">
            <img
              src={page.imageUrl}
              alt={page.title}
              className="w-full max-w-4xl h-auto rounded-lg shadow-sm"
            />
          </div>
        ) : null}
        
        {/* Render content */}
        {page.content && (
          <div 
            className="prose lg:prose-lg max-w-none" 
            dangerouslySetInnerHTML={{ __html: page.content }} 
          />
        )}
      </div>
    </div>
  );
}

export default CmsPage;