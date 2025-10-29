import React, { useState, useEffect } from 'react';
import { apiGet } from '../utils/api';

/**
 * A flexible component to render content from the CMS.
 * @param {string} slug - The unique identifier for the content block in the CMS.
 * @param {React.ElementType} [as='div'] - The HTML tag to use as the wrapper (e.g., 'h1', 'p').
 * @param {boolean} [prose=true] - Whether to apply Tailwind's typography styling.
 * @param {string} [className=''] - Additional CSS classes to apply to the wrapper.
 * @param {React.ReactNode} [children] - Fallback content to display if nothing is fetched from the CMS.
 * @param {boolean} [showImage=true] - Whether to display the CMS image if available.
 * @param {string} [imageClassName=''] - Additional CSS classes for the image.
 * @param {string} [fallbackImage=''] - Fallback image URL if no CMS image is available.
 */
function CmsContent({ slug, as: Component = 'div', prose = true, className = '', children, showImage = true, imageClassName = '', fallbackImage = '' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const fetchContent = async () => {
      setLoading(true);
      try {
        const result = await apiGet(`/api/cms/slug/${slug}`);
        setData(result);
      } catch (err) {
        // Silently handle 404s (NOT_FOUND errors) - fallback content will be used
        if (err.message === 'NOT_FOUND') {
          setData(null);
        } else {
          // Only log unexpected errors
          console.error(`Error fetching CMS content for ${slug}:`, err.message);
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [slug]);

  // While loading, show a subtle placeholder to prevent layout shifts.
  if (loading) {
    return <Component className={`animate-pulse bg-gray-200 rounded-md ${className}`}>&nbsp;</Component>;
  }

  // Use the fetched content, or the fallback children if fetch failed or content is empty.
  const contentToRender = data?.content || children;
  const imageToRender = data?.imageUrl || fallbackImage;

  if (!contentToRender && !imageToRender) {
    return null; // Render nothing if there's no content and no image.
  }

  const proseClass = prose ? 'prose lg:prose-lg max-w-none' : '';
  const finalClassName = `${proseClass} ${className}`.trim();
  const finalImageClassName = `w-full h-auto object-contain ${imageClassName}`.trim();

  // Render both image and content if available
  return (
    <div className="space-y-4">
      {/* Render image if available and showImage is true */}
      {showImage && imageToRender && (
        <div className="flex justify-center">
          <img 
            src={imageToRender} 
            alt={data?.title || 'CMS Image'} 
            className={finalImageClassName}
            loading="lazy"
          />
        </div>
      )}
      
      {/* Render content if available */}
      {contentToRender && (
        <Component className={finalClassName} dangerouslySetInnerHTML={{ __html: contentToRender }} />
      )}
    </div>
  );
}

export default CmsContent;