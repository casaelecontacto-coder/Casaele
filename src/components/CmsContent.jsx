import React, { useState, useEffect, useContext } from 'react';
import { HomePageContext } from '../context/HomePageContext';
import { AboutPageContext } from '../context/AboutPageContext';
import { useApiCache } from '../context/ApiCacheContext';

/**
 * A flexible component to render content from the CMS.
 * Uses global API cache to prevent duplicate fetches.
 * @param {string} slug - The unique identifier for the content block in the CMS.
 * @param {React.ElementType} [as='div'] - The HTML tag to use as the wrapper (e.g., 'h1', 'p').
 * @param {boolean} [prose=true] - Whether to apply Tailwind's typography styling.
 * @param {string} [className=''] - Additional CSS classes to apply to the wrapper.
 * @param {React.ReactNode} [children] - Fallback content to display if nothing is fetched from the CMS.
 * @param {boolean} [showImage=true] - Whether to display the CMS image if available.
 * @param {string} [imageClassName=''] - Additional CSS classes for the image.
 * @param {string} [fallbackImage=''] - Fallback image URL if no CMS image is available.
 * @param {boolean} [useContextData=false] - If true, tries to use context data first (for page optimization).
 * @param {string} [contextType='home'] - Context type: 'home' or 'about'.
 */
function CmsContent({ slug, as: Component = 'div', prose = true, className = '', children, showImage = true, imageClassName = '', fallbackImage = '', renderContent = true, useContextData = false, contextType = 'home' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const homePageContext = useContextData && contextType === 'home' ? useContext(HomePageContext) : null;
  const aboutPageContext = useContextData && contextType === 'about' ? useContext(AboutPageContext) : null;
  const { fetchCached, getCached } = useApiCache();

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    // Try to use context data first if available (for page optimization)
    if (useContextData && contextType === 'home' && homePageContext?.homeData?.cms?.[slug]) {
      const cmsItem = homePageContext.homeData.cms[slug];
      setData({
        content: cmsItem.content || '',
        imageUrl: cmsItem.imageUrl || '',
        title: cmsItem.title || ''
      });
      setLoading(false);
      return;
    }

    // Try to use About page context data
    if (useContextData && contextType === 'about' && aboutPageContext?.aboutData?.cms?.[slug]) {
      const cmsItem = aboutPageContext.aboutData.cms[slug];
      setData({
        content: cmsItem.content || '',
        imageUrl: cmsItem.imageUrl || '',
        title: cmsItem.title || '',
        secondSectionEmbed: cmsItem.secondSectionEmbed || null
      });
      setLoading(false);
      return;
    }

    // Use global API cache to prevent duplicate fetches
    const endpoint = `/api/cms/slug/${slug}`;
    
    // Check if already cached
    const cached = getCached(endpoint);
    if (cached) {
      if (cached.data) {
        setData(cached.data);
        setLoading(false);
        return;
      }
      if (cached.error && cached.error.message === 'NOT_FOUND') {
        setData(null);
        setLoading(false);
        return;
      }
    }

    // Fetch using cache (will only fetch once even if multiple components request)
    const fetchContent = async () => {
      setLoading(true);
      try {
        const result = await fetchCached(endpoint);
        if (result.data) {
          setData(result.data);
        } else if (result.error) {
          // Silently handle 404s (NOT_FOUND errors) - fallback content will be used
          if (result.error.message === 'NOT_FOUND' || result.error.message?.includes('404')) {
            setData(null);
          } else {
            console.error(`Error fetching CMS content for ${slug}:`, result.error.message);
            setData(null);
          }
        }
      } catch (err) {
        // Handle promise rejection
        if (err.message === 'NOT_FOUND' || err.message?.includes('404')) {
          setData(null);
        } else {
          console.error(`Error fetching CMS content for ${slug}:`, err.message);
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [slug, useContextData, contextType, homePageContext, aboutPageContext, fetchCached, getCached]);

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
      
      {/* Render content if available and allowed */}
      {renderContent && contentToRender && (
        <Component className={finalClassName} dangerouslySetInnerHTML={{ __html: contentToRender }} />
      )}
    </div>
  );
}

export default CmsContent;