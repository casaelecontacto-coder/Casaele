import React, { useState, useEffect, useRef, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set the worker source using the local bundled file
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Individual page component rendered to canvas
const Page = React.forwardRef(({ pageImage, pageNumber, totalPages }, ref) => {
  return (
    <div ref={ref} className="bg-white flex items-center justify-center relative" style={{ width: '100%', height: '100%' }}>
      {pageImage ? (
        <img
          src={pageImage}
          alt={`Page ${pageNumber}`}
          className="w-full h-full object-contain"
          style={{ display: 'block' }}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      )}
      <div className="absolute bottom-2 left-0 right-0 text-center">
        <span className="text-xs text-gray-400 bg-white/80 px-2 py-0.5 rounded">
          {pageNumber} / {totalPages}
        </span>
      </div>
    </div>
  );
});

Page.displayName = 'Page';

function FlipbookViewer({ pdfUrl, title }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 400, height: 560 });
  const bookRef = useRef(null);
  const containerRef = useRef(null);

  // Calculate book dimensions based on container
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      // For mobile: single page view, for desktop: double page spread
      const isMobile = containerWidth < 768;
      let pageWidth, pageHeight;

      if (isMobile) {
        pageWidth = Math.min(containerWidth - 32, 450);
        pageHeight = Math.round(pageWidth * 1.414); // A4 ratio
      } else {
        pageWidth = Math.min(Math.floor((containerWidth - 32) / 2), 500);
        pageHeight = Math.round(pageWidth * 1.414);
      }

      setDimensions({ width: pageWidth, height: pageHeight });
    }
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  // Load PDF and render pages
  useEffect(() => {
    if (!pdfUrl) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPages([]);

    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        if (cancelled) return;

        setTotalPages(pdf.numPages);
        const pageImages = [];

        // Render all pages to images
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;

          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2 }); // Higher scale for quality

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport }).promise;

          pageImages.push(canvas.toDataURL('image/jpeg', 0.85));

          // Update pages progressively
          if (!cancelled) {
            setPages([...pageImages]);
          }
        }

        if (!cancelled) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading PDF:', err);
        if (!cancelled) {
          setError('Failed to load the magazine PDF. Please try opening it directly.');
          setLoading(false);
        }
      }
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [pdfUrl]);

  const onFlip = useCallback((e) => {
    setCurrentPage(e.data);
  }, []);

  const goToPrev = () => {
    bookRef.current?.pageFlip()?.flipPrev();
  };

  const goToNext = () => {
    bookRef.current?.pageFlip()?.flipNext();
  };

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-gray-600 mb-4">{error}</p>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 transition-colors font-semibold"
        >
          Open PDF Directly
        </a>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Flipbook */}
      <div className="flex items-center justify-center bg-gray-800 py-8 px-4 relative" style={{ minHeight: dimensions.height + 80 }}>
        {loading && pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <p className="text-white text-sm">Loading magazine pages...</p>
          </div>
        ) : pages.length > 0 ? (
          <>
            <HTMLFlipBook
              ref={bookRef}
              width={dimensions.width}
              height={dimensions.height}
              size="stretch"
              minWidth={280}
              maxWidth={500}
              minHeight={400}
              maxHeight={720}
              showCover={true}
              maxShadowOpacity={0.5}
              mobileScrollSupport={true}
              onFlip={onFlip}
              className="flipbook-shadow"
              style={{}}
              startPage={0}
              drawShadow={true}
              flippingTime={600}
              usePortrait={window.innerWidth < 768}
              startZIndex={0}
              autoSize={true}
              clickEventForward={false}
              useMouseEvents={true}
              swipeDistance={30}
              showPageCorners={true}
            >
              {pages.map((pageImage, index) => (
                <Page
                  key={index}
                  pageImage={pageImage}
                  pageNumber={index + 1}
                  totalPages={totalPages}
                />
              ))}
            </HTMLFlipBook>

            {/* Navigation arrows */}
            <button
              onClick={goToPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 transition-colors backdrop-blur-sm"
              aria-label="Previous page"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 transition-colors backdrop-blur-sm"
              aria-label="Next page"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        ) : null}
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
        <button
          onClick={goToPrev}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-700 transition-colors font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        <span className="text-sm text-gray-500">
          {loading && pages.length > 0
            ? `Loading... (${pages.length}/${totalPages} pages)`
            : `Page ${currentPage + 1} of ${totalPages}`
          }
        </span>

        <button
          onClick={goToNext}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-700 transition-colors font-medium"
        >
          Next
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Fallback link */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          Tip: Click on the page edges or use arrows to flip.{' '}
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-600 hover:text-red-800 underline"
          >
            Open PDF directly
          </a>
        </p>
      </div>
    </div>
  );
}

export default FlipbookViewer;
