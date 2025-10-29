import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiGet } from '../utils/api';

function CmsPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetches the page data from your backend using the slug from the URL
        const data = await apiGet(`/api/cms/slug/${slug}`);
        console.log('📄 Fetched CMS page data:', data);
        console.log('🔗 Has embed?', !!data.secondSectionEmbed);
        console.log('🖼️ Has image?', !!data.imageUrl);
        setPage(data);
      } catch (err) {
        console.error('❌ Error fetching CMS page:', err);
        setError('Page not found. Please check the URL and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]); // This will re-run whenever the slug in the URL changes

  if (loading) {
    return <div className="text-center p-20 font-semibold">Loading Page...</div>;
  }

  if (error) {
    return <div className="text-center p-20 text-red-600">{error}</div>;
  }

  // Debug logging
  console.log('🎨 Rendering CMS page:', {
    hasEmbed: !!page.secondSectionEmbed,
    embedTitle: page.secondSectionEmbed?.title,
    embedCodeLength: page.secondSectionEmbed?.embedCode?.length,
    hasImage: !!page.imageUrl,
    imageUrl: page.imageUrl
  });

  // Temporary debug display
  if (page.secondSectionEmbed) {
    console.log('✅ Embed Data Structure:', {
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