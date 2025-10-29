// src/components/About/GardenSection.jsx

import React from 'react'
import { useNavigate } from 'react-router-dom';
import CmsContent from "../CmsContent"; // Import CmsContent

const GardenSection = () => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate('/garden-of-ideas');
  };

  return (
    <>
      {/* Garden of Ideas */}
      <section className="py-12 sm:py-16 px-4 sm:px-8 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12 bg-white rounded-xl shadow-lg p-6 sm:p-8">
          
          {/* Left Side: Image from CMS */}
          <CmsContent
            slug="about-garden-section-content" // Use the new unique slug
            showImage={true}
            imageClassName="w-60 sm:w-72 md:w-80 h-auto rounded-lg mx-auto"
            fallbackImage="/About/image 11.jpg" // Keep the original as a fallback
          >
            {/* Fallback Image */}
            <img
              src="/About/image 11.jpg"
              alt="Alien Gardening"
              className="w-60 sm:w-72 md:w-80 h-auto rounded-lg mx-auto"
            />
          </CmsContent>

          {/* Right Side: Text Content from CMS */}
          <div className="text-center md:text-left">
            <CmsContent
              slug="about-garden-section-content" // Use the same unique slug
              showImage={false} // Only display content/text here
              as="div"
              className="space-y-4" // Use prose/space-y for formatting
            >
              {/* Fallback Text */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                El jardín de ideas
              </h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base md:text-lg">
                Hola, Earth friends! I’m Ele, and I need your help to make
                CasaDeEle even more awesome! This garden is where your ideas grow
                — share a song, a fun feature, or a way to make learning Spanish
                more exciting... Hola, Earth friends! I’m Ele, and I need your help to make
                CasaDeEle even more awesome! This garden is where your ideas grow
                — share a song, a fun feature, or a way to make learning Spanish
                more exciting...
              </p>
            </CmsContent>
            
            <button
              onClick={handleNavigate}
              className="bg-[rgba(173,21,24,1)] hover:bg-red-700 text-white font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-full transition-colors lg:px-24 mt-4"
            >
              Share Your Ideas
            </button>
          </div>
        </div>
      </section>
    </>
  )
}

export default GardenSection
