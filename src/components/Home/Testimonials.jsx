import React, { useState, useEffect } from "react";
import { GoArrowLeft, GoArrowRight } from "react-icons/go";
import { apiGet } from "../../utils/api";

function Testimonials() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const CHARACTER_LIMIT = 180;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(3);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setLoading(true)
    apiGet('/api/testimonials/approved')
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex - itemsPerPage;
      const lastPossibleIndex = Math.floor(((items?.length || 0) - 1) / itemsPerPage) * itemsPerPage;
      return newIndex < 0 ? lastPossibleIndex : newIndex;
    });
  };
  
  const handleNext = () => {
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex + itemsPerPage;
      return newIndex >= (items?.length || 0) ? 0 : newIndex;
    });
  };

  const visibleTestimonials = (items || []).slice(currentIndex, currentIndex + itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <h1 className="text-center font-bold text-black text-2xl sm:text-3xl md:text-4xl mb-10 md:mb-12">
        Testimonials
      </h1>

      {/* Main container is now relative for button positioning */}
      <div className="relative">
        <button
          onClick={handlePrev}
          // Buttons are positioned absolutely
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex-shrink-0 bg-white border border-gray-300 rounded-full p-3 shadow-sm hover:bg-gray-100 transition-colors"
          aria-label="Previous Testimonial"
        >
          <GoArrowLeft className="text-gray-600 text-2xl" />
        </button>

        {/* This container adds padding on mobile to create space */}
        <div className="w-full flex justify-center gap-6 px-12 md:px-0">
          {loading ? (
            <div className="w-full text-center py-10 text-gray-500">Loading testimonials...</div>
          ) : visibleTestimonials.length === 0 ? (
            <div className="w-full text-center py-10 text-gray-400">No testimonials yet.</div>
          ) : visibleTestimonials.map((t, index) => (
            <div
              key={index}
              className="w-full sm:w-72 lg:w-64 min-h-96 flex-shrink-0 flex flex-col bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              {/* Quote icon positioned at top right */}
              <div className="flex justify-end mb-4">
                <img
                  src="/Home/Frame.svg"
                  alt="Quote"
                  className="w-8 h-8 flex-shrink-0"
                />
              </div>
              
              {/* Testimonial message */}
              <p className="flex-grow text-sm mb-6 font-medium leading-relaxed text-gray-700">
                {(t.message || '').length > CHARACTER_LIMIT
                  ? `${(t.message || '').substring(0, CHARACTER_LIMIT)}...`
                  : (t.message || '')}
              </p>
              
              <div className="flex-shrink-0 border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  {/* Profile photo on the left */}
                  <div className="flex-shrink-0">
                    {t.videoUrl ? (
                      <img 
                        src={t.videoUrl} 
                        alt="Profile" 
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* User details on the right */}
                  <div className="text-right flex-1 ml-4">
                    <p className="font-semibold text-gray-800 mb-2">{t.name || 'Anonymous'}</p>
                    
                    {/* User details in a more organized layout */}
                    <div className="space-y-1">
                      {t.profession && (
                        <p className="text-sm text-gray-600 font-medium">{t.profession}</p>
                      )}
                      {t.country && (
                        <p className="text-sm text-gray-600">{t.country}</p>
                      )}
                      {t.level && (
                        <p className="text-sm text-gray-600">Level: {t.level}</p>
                      )}
                      {/* Always show rating stars */}
                      <div className="flex items-center justify-end gap-1 mt-3">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => {
                            const rating = Number(t.rating) || 0;
                            const isFilled = i < Math.floor(rating);
                            const isHalfFilled = i === Math.floor(rating) && rating % 1 >= 0.5;
                            
                            return (
                              <svg
                                key={i}
                                className={`w-3 h-3 ${isFilled ? 'text-yellow-400' : isHalfFilled ? 'text-yellow-300' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            );
                          })}
                        </div>
                        <span className="text-xs text-gray-500 ml-1">
                          {t.rating ? `${(Number(t.rating) || 0).toFixed(1)}/5` : 'No rating'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex-shrink-0 bg-white border border-gray-300 rounded-full p-3 shadow-sm hover:bg-gray-100 transition-colors"
          aria-label="Next Testimonial"
        >
          <GoArrowRight className="text-gray-600 text-2xl" />
        </button>
      </div>
    </div>
  );
}

export default Testimonials;