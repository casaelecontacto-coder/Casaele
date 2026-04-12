import React, { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { HomePageContext } from "../../context/HomePageContext";
import { apiGet } from "../../utils/api";

function HeroSection() {
  const navigate = useNavigate();
  const homeCtx = useContext(HomePageContext);
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState("next");

  useEffect(() => {
    if (homeCtx?.homeData?.homeSlides?.length) {
      setSlides(homeCtx.homeData.homeSlides);
    } else {
      apiGet("/api/home-slides")
        .then((data) => { if (data?.length) setSlides(data); })
        .catch(() => {});
    }
  }, [homeCtx]);

  // Auto-play every 4 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => goToNext(), 4000);
    return () => clearInterval(timer);
  }, [slides.length, currentSlide]);

  const goToNext = useCallback(() => {
    if (isAnimating || slides.length <= 1) return;
    setDirection("next");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      setIsAnimating(false);
    }, 500);
  }, [isAnimating, slides.length]);

  const goToPrev = useCallback(() => {
    if (isAnimating || slides.length <= 1) return;
    setDirection("prev");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      setIsAnimating(false);
    }, 500);
  }, [isAnimating, slides.length]);

  const goToSlide = useCallback(
    (index) => {
      if (isAnimating || index === currentSlide) return;
      setDirection(index > currentSlide ? "next" : "prev");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(index);
        setIsAnimating(false);
      }, 500);
    },
    [isAnimating, currentSlide]
  );

  const handleButtonClick = (link) => {
    if (!link) return;
    if (link.startsWith("http")) {
      window.open(link, "_blank", "noopener,noreferrer");
    } else {
      navigate(link);
    }
  };

  const slide = slides[currentSlide];

  const getSlideClass = () => {
    if (!isAnimating) return "opacity-100 translate-x-0";
    if (direction === "next") return "opacity-0 -translate-x-8";
    return "opacity-0 translate-x-8";
  };

  return (
    <section className="px-6 py-12 md:py-20 md:px-12 lg:px-24 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
        {/* LEFT: Slideshow */}
        <div className="w-full lg:w-1/2 flex flex-col items-center">
          {slides.length > 0 ? (
            <div className="w-full max-w-md">
              {/* Slide Image */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl bg-white">
                <div className="relative w-full aspect-[3/4] overflow-hidden">
                  <img
                    src={slide?.imageUrl}
                    alt={slide?.title || "Slide"}
                    className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${getSlideClass()}`}
                  />
                </div>

                {/* Nav arrows */}
                {slides.length > 1 && (
                  <>
                    <button
                      onClick={goToPrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-md transition-colors"
                      aria-label="Previous slide"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={goToNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-md transition-colors"
                      aria-label="Next slide"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Vamos Button below the image */}
              <button
                onClick={() => handleButtonClick(slide?.buttonLink)}
                className="mt-4 w-full bg-[rgba(173,21,24,1)] hover:bg-red-700 text-white py-3.5 rounded-full font-semibold text-lg transition-colors shadow-lg"
              >
                {slide?.buttonText || "Vamos"}
              </button>

              {/* Dot indicators */}
              {slides.length > 1 && (
                <div className="flex justify-center gap-2.5 mt-5">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToSlide(idx)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        idx === currentSlide
                          ? "bg-[rgba(173,21,24,1)] scale-125"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-md aspect-[3/4] rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
              <p className="text-gray-400 text-lg">Slideshow coming soon</p>
            </div>
          )}
        </div>

        {/* RIGHT: Alien image (speech bubble is part of the image) */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <div className="max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
            <img
              src="/Home/image 58.jpeg"
              alt="Ele the alien - Hola! Como estas? See the latest updates here"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
