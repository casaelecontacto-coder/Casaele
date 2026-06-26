// src/components/Material/MaterialDetail/DropDown.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { FaAngleDown } from "react-icons/fa";

// Auto-resizing iframe for HTML embeds — expands to full content height, no scroll
// Hard ceiling so a misbehaving embed can never grow the iframe unbounded.
const MAX_IFRAME_HEIGHT = 30000;
// If the reported height keeps increasing this many times in a row, treat it as a
// feedback loop (e.g. viewport-sized content) and stop following it.
const RUNAWAY_GROWTH_LIMIT = 25;

function AutoResizeIframe({ src }) {
  const iframeRef = useRef(null);
  const [height, setHeight] = useState(200);
  const lastHeightRef = useRef(0);
  const growthCountRef = useRef(0);

  useEffect(() => {
    function onMessage(e) {
      if (e.data && e.data.type === 'iframeResize' && typeof e.data.height === 'number') {
        // Only update if this message came from our iframe
        if (iframeRef.current && e.source === iframeRef.current.contentWindow) {
          const h = e.data.height;
          // Detect a runaway growth loop: monotonically increasing height across
          // many messages means the content is sizing itself to the iframe.
          if (h > lastHeightRef.current + 1) {
            growthCountRef.current += 1;
          } else {
            growthCountRef.current = 0;
          }
          lastHeightRef.current = h;
          if (growthCountRef.current > RUNAWAY_GROWTH_LIMIT) return; // freeze — likely a loop
          setHeight(Math.min(h, MAX_IFRAME_HEIGHT));
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://amrit-project-lms.onrender.com';

// Normalize any embed into a single, unambiguous shape:
//   - iframeSrc: a URL to load in an <iframe> (used for uploaded HTML files, via the proxy), or null
//   - html:      raw markup to inject with dangerouslySetInnerHTML (always a string)
// Returning explicit fields (never a string|object union) makes it impossible to
// accidentally render "[object Object]".
const normalizeEmbed = (embedCode, embedType) => {
  if (!embedCode || typeof embedCode !== 'string') {
    return { iframeSrc: null, html: '' };
  }

  const trimmed = embedCode.trim();

  const isBareUrl = /^https?:\/\//i.test(trimmed) && !trimmed.startsWith('<');
  // Uploaded HTML files live under the Cloudinary "html-activities" folder and end in .html.
  const looksLikeHtmlFile = /\.html(\?.*)?$/i.test(trimmed) || /\/html-activities\//i.test(trimmed);

  // Case 1: a direct link to an HTML file (uploaded via the admin panel) — load through the proxy.
  if (isBareUrl && (embedType === 'HTML' || looksLikeHtmlFile)) {
    return {
      iframeSrc: `${API_BASE_URL}/api/html-proxy?url=${encodeURIComponent(trimmed)}`,
      html: '',
    };
  }

  // Case 2: embed code that contains an <iframe src="....html"> — rewrite its src through the proxy.
  const iframeMatch = trimmed.match(/<iframe[^>]*src=["']([^"']+\.html[^"']*)["'][^>]*>/i);
  if (iframeMatch) {
    const originalSrc = iframeMatch[1];
    const proxyUrl = `${API_BASE_URL}/api/html-proxy?url=${encodeURIComponent(originalSrc)}`;
    const html = trimmed.replace(
      /<iframe([^>]*)src=["'][^"']*["']([^>]*)>/i,
      (match, before, after) => {
        before = before.replace(/sandbox=["'][^"']*["']/gi, '');
        after = after.replace(/sandbox=["'][^"']*["']/gi, '');
        return `<iframe${before} src="${proxyUrl}"${after} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox" allowfullscreen>`;
      }
    );
    return { iframeSrc: null, html };
  }

  // Case 3: plain embed code (AI / H5P script or iframe) — inject as-is.
  return { iframeSrc: null, html: trimmed };
};

// Renders a normalized embed: an auto-resizing iframe for HTML files, otherwise raw markup.
function EmbedBody({ embed }) {
  if (embed.iframeSrc) {
    return <AutoResizeIframe src={embed.iframeSrc} />;
  }
  return <div dangerouslySetInnerHTML={{ __html: embed.html }} />;
}

// Accept 'title' as a prop
function DropDown({ title = "Ejercicios", exercises = [] }) { // Default title if prop not passed
  const [active, setActive] = useState(null);

  // Normalize every embed once into { iframeSrc, html }
  const processedExercises = useMemo(() => {
    return exercises.map(exercise => ({
      ...exercise,
      embed: normalizeEmbed(exercise.embedCode, exercise.type),
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
              <EmbedBody embed={item.embed} />
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
                  <EmbedBody embed={item.embed} />
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
