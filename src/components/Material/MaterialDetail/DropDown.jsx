// src/components/Material/MaterialDetail/DropDown.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { FaAngleDown } from "react-icons/fa";

// Auto-resizing iframe for HTML embeds — expands to full content height, no scroll
function AutoResizeIframe({ src }) {
  const iframeRef = useRef(null);
  const [height, setHeight] = useState(200);

  useEffect(() => {
    function onMessage(e) {
      if (e.data && e.data.type === 'iframeResize' && typeof e.data.height === 'number') {
        // Only update if this message came from our iframe
        if (iframeRef.current && e.source === iframeRef.current.contentWindow) {
          setHeight(e.data.height);
        }
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src={src}
      style={{ width: '100%', height: height + 'px', border: 'none', borderRadius: '8px', overflow: 'hidden' }}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox"
      allowFullScreen
      scrolling="no"
    />
  );
}

// Helper function to process embed code for HTML files
const processEmbedCode = (embedCode, embedType) => {
  if (!embedCode) return embedCode;

  const trimmed = embedCode.trim();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://amrit-project-lms.onrender.com';

  // Check if embedCode is a direct URL to an HTML file (trim whitespace, allow query params)
  const isDirectHtmlUrl = trimmed.match(/^https?:\/\/.*\.html(\?.*)?$/i) || embedType === 'HTML';

  if (isDirectHtmlUrl && !trimmed.startsWith('<')) {
    const proxyUrl = `${apiBaseUrl}/api/html-proxy?url=${encodeURIComponent(trimmed)}`;
    // Return the proxy URL directly — AutoResizeIframe will handle rendering
    return { __htmlProxyUrl: proxyUrl };
  }

  // Check if embedCode contains an iframe with HTML file
  const iframeMatch = trimmed.match(/<iframe[^>]*src=["']([^"']+\.html[^"']*)["'][^>]*>/i);

  if (iframeMatch) {
    const originalSrc = iframeMatch[1];
    const proxyUrl = `${apiBaseUrl}/api/html-proxy?url=${encodeURIComponent(originalSrc)}`;

    let processedCode = trimmed.replace(
      /<iframe([^>]*)src=["'][^"']*["']([^>]*)>/i,
      (match, before, after) => {
        before = before.replace(/sandbox=["'][^"']*["']/gi, '');
        after = after.replace(/sandbox=["'][^"']*["']/gi, '');
        return `<iframe${before} src="${proxyUrl}"${after} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox" allowfullscreen>`;
      }
    );

    return processedCode;
  }

  return trimmed;
};

// Accept 'title' as a prop
function DropDown({ title = "Ejercicios", exercises = [] }) { // Default title if prop not passed
  const [active, setActive] = useState(null);

  // Memoize processed embed codes
  const processedExercises = useMemo(() => {
    return exercises.map(exercise => ({
      ...exercise,
      processedEmbedCode: processEmbedCode(exercise.embedCode, exercise.type)
    }));
  }, [exercises]);

  // Separate HTML embeds (shown fully) from non-HTML embeds (shown in accordion)
  const htmlEmbeds = processedExercises.filter(item => item.type === 'HTML');
  const otherEmbeds = processedExercises.filter(item => item.type !== 'HTML');

  return (
    <div className="w-full">
      {title && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-0">
            {title}
          </h1>
        </div>
      )}

      {/* HTML embeds rendered fully visible without accordion — auto-resizes to content */}
      {htmlEmbeds.length > 0 && (
        <div className="space-y-6 mb-6">
          {htmlEmbeds.map((item, i) => (
            <div key={item._id || `html-${i}`} className="w-full">
              {item.processedEmbedCode && item.processedEmbedCode.__htmlProxyUrl ? (
                <AutoResizeIframe src={item.processedEmbedCode.__htmlProxyUrl} />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: item.processedEmbedCode }} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Non-HTML embeds in accordion */}
      {otherEmbeds.length > 0 && (
        <div className="space-y-4">
          {otherEmbeds.map((item, i) => (
            <div key={item._id || i} className="border border-gray-200 rounded-xl p-4 sm:p-5">
              <div
                className="flex items-center justify-between cursor-pointer gap-4"
                onClick={() => setActive(active === i ? null : i)}
              >
                <div className="flex items-center gap-4">
                  <img src={item.type === 'AI' ? "/Material/cartoon1.svg" : "/Material/cartoon2.svg"} alt="icon" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  <p className="text-base font-medium text-gray-800">{item.title}</p>
                </div>
                <FaAngleDown
                  className={`text-xl text-gray-500 transition-transform duration-300 flex-shrink-0 ${active === i ? "rotate-180" : ""}`}
                />
              </div>

              {active === i && (
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <div dangerouslySetInnerHTML={{ __html: item.processedEmbedCode }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DropDown;
