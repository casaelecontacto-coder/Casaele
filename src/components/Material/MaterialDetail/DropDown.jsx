// src/components/Material/MaterialDetail/DropDown.jsx
import React, { useState, useMemo } from "react";
import { FaAngleDown } from "react-icons/fa";

// Helper function to process embed code for HTML files
const processEmbedCode = (embedCode) => {
  if (!embedCode) return embedCode;

  // Check if embedCode is a direct URL to an HTML file
  const isDirectHtmlUrl = embedCode.match(/^https?:\/\/.*\.html$/i);

  if (isDirectHtmlUrl) {
    // Wrap direct HTML URLs in an iframe with proper sandbox attributes
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const proxyUrl = `${apiBaseUrl}/api/html-proxy?url=${encodeURIComponent(embedCode)}`;

    return `<iframe
      src="${proxyUrl}"
      style="width: 100%; min-height: 600px; border: none; border-radius: 8px;"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      loading="lazy"
    ></iframe>`;
  }

  // Check if embedCode contains an iframe with HTML file
  const iframeMatch = embedCode.match(/<iframe[^>]*src=["']([^"']+\.html[^"']*)["'][^>]*>/i);

  if (iframeMatch) {
    const originalSrc = iframeMatch[1];
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const proxyUrl = `${apiBaseUrl}/api/html-proxy?url=${encodeURIComponent(originalSrc)}`;

    // Replace the iframe src with proxy URL and add/update sandbox attribute
    let processedCode = embedCode.replace(
      /<iframe([^>]*)src=["'][^"']*["']([^>]*)>/i,
      (match, before, after) => {
        // Remove existing sandbox attribute if present
        before = before.replace(/sandbox=["'][^"']*["']/gi, '');
        after = after.replace(/sandbox=["'][^"']*["']/gi, '');

        return `<iframe${before} src="${proxyUrl}"${after} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals">`;
      }
    );

    return processedCode;
  }

  // Return original embedCode if no HTML file detected
  return embedCode;
};

// Accept 'title' as a prop
function DropDown({ title = "Ejercicios", exercises = [] }) { // Default title if prop not passed
  const [active, setActive] = useState(null);

  // Memoize processed embed codes
  const processedExercises = useMemo(() => {
    return exercises.map(exercise => ({
      ...exercise,
      processedEmbedCode: processEmbedCode(exercise.embedCode)
    }));
  }, [exercises]);

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        {/* Use the title prop here */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-0">
          {title} {/* <-- Display the title */}
        </h1>
      </div>

      <div className="space-y-4">
        {processedExercises.map((item, i) => (
          // ... rest of the dropdown item mapping ...
             <div key={item._id || i} className="border border-gray-200 rounded-xl p-4 sm:p-5">
            <div
              className="flex items-center justify-between cursor-pointer gap-4"
              onClick={() => setActive(active === i ? null : i)}
            >
              <div className="flex items-center gap-4">
                <img src={item.type === 'AI' ? "/Material/cartoon1.svg" : item.type === 'HTML' ? "/Material/cartoon1.svg" : "/Material/cartoon2.svg"} alt="icon" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
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
    </div>
  );
}

export default DropDown;
