import React, { useState, useEffect } from "react";
import { GoArrowLeft, GoArrowRight } from "react-icons/go";

// Custom hook to check for screen size changes
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches, query]);

  return matches;
};

// Helper function to generate a range of numbers
const range = (start, end) => {
  return Array.from({ length: end - start + 1 }, (_, idx) => idx + start);
};


function Pagination({ currentPage, setCurrentPage, totalPages }) {
  const isMobile = useMediaQuery("(max-width: 639px)");

  const getPageNumbers = () => {
    // --- MOBILE LOGIC ---
    if (isMobile) {
      if (totalPages <= 5) return range(1, totalPages);

      const pages = new Set();
      pages.add(1);
      pages.add(currentPage);
      pages.add(totalPages);

      const sortedPages = Array.from(pages).sort((a, b) => a - b);
      const finalPages = [];
      let lastPage = 0;

      for (const page of sortedPages) {
        if (lastPage > 0 && page - lastPage > 1) {
          finalPages.push("…");
        }
        finalPages.push(page);
        lastPage = page;
      }
      return finalPages;
    }

    // --- DESKTOP LOGIC ---
    const totalNumbers = 5;
    const totalBlocks = totalNumbers + 2;

    if (totalPages <= totalBlocks) {
      return range(1, totalPages);
    }

    const startPage = Math.max(2, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);
    let pages = range(startPage, endPage);

    const hasLeftSpill = startPage > 2;
    const hasRightSpill = totalPages - endPage > 1;
    const spillOffset = totalNumbers - (pages.length + 1);

    switch (true) {
      case hasLeftSpill && !hasRightSpill:
        pages = ["…", ...range(startPage - spillOffset, startPage - 1), ...pages];
        break;
      case !hasLeftSpill && hasRightSpill:
        pages = [...pages, ...range(endPage + 1, endPage + spillOffset), "…"];
        break;
      case hasLeftSpill && hasRightSpill:
      default:
        pages = ["…", ...pages, "…"];
        break;
    }
    return [1, ...pages, totalPages];
  };

  const pages = getPageNumbers();

  const pageButtons = pages.map((page, index) => (
    <li key={index} className="flex-shrink-0">
      {typeof page === "number" ? (
        <button
          onClick={() => setCurrentPage(page)}
          aria-current={currentPage === page ? "page" : undefined}
          className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 text-sm font-medium rounded-lg transition-colors duration-200 ${
            currentPage === page
              ? "bg-gray-500 text-white"
              : "bg-white text-gray-700 shadow-sm hover:bg-gray-100"
          }`}
        >
          {page}
        </button>
      ) : (
        <span className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 text-sm text-gray-500">
          {page}
        </span>
      )}
    </li>
  ));

  return (
    <nav aria-label="Page navigation">
      {/* Conditionally render layout based on screen size */}
      {isMobile ? (
        // --- MOBILE LAYOUT (All items centered together) ---
        <ul className="flex flex-nowrap justify-center items-center gap-1 my-12 px-4">
          <li className="flex-shrink-0">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Previous Page"
              className="flex items-center justify-center px-3 h-9 text-sm font-medium text-gray-700 bg-white rounded-lg border border-black hover:bg-gray-100 disabled:opacity-50"
            >
              <GoArrowLeft className="w-4 h-4" />
            </button>
          </li>
          {pageButtons}
          <li className="flex-shrink-0">
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              aria-label="Next Page"
              className="flex items-center justify-center px-3 h-9 text-sm font-medium text-gray-700 bg-white rounded-lg border border-black hover:bg-gray-100 disabled:opacity-50"
            >
              <GoArrowRight className="w-4 h-4" />
            </button>
          </li>
        </ul>
      ) : (
        // --- DESKTOP LAYOUT (Space-between) ---
        <ul className="flex flex-nowrap justify-between items-center my-12 px-4">
          <li className="flex-shrink-0">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Previous Page"
              className="flex items-center justify-center px-4 h-10 text-sm font-medium text-gray-700 bg-white rounded-lg border border-black hover:bg-gray-100 disabled:opacity-50"
            >
              <GoArrowLeft className="w-4 h-4" />
              <span className="ml-2">Previous</span>
            </button>
          </li>
          <ul className="flex items-center gap-3">{pageButtons}</ul>
          <li className="flex-shrink-0">
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              aria-label="Next Page"
              className="flex items-center justify-center px-4 h-10 text-sm font-medium text-gray-700 bg-white rounded-lg border border-black hover:bg-gray-100 disabled:opacity-50"
            >
              <span className="mr-2">Next</span>
              <GoArrowRight className="w-4 h-4" />
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
}

export default Pagination;