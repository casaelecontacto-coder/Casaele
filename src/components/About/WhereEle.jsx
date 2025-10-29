// src/components/About/WhereEle.jsx

import React, { useState, useEffect } from 'react'
import { apiGet } from "../../utils/api";

const WhereEle = () => {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/api/cms/slug/about-where-ele-map-image')
      .then(data => {
        console.log('🗺️ WhereEle section data:', data);
        console.log('🔗 Has embed?', !!data.secondSectionEmbed);
        setMapData(data);
      })
      .catch(err => console.error("Failed to load WhereEle data:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Where is Ele Now Section */}
      <section className="py-12 sm:py-16 bg-white text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-12">
          Where is Ele Now?
        </h2>
        
        {/* Render H5P embed if available, otherwise render image */}
        {loading ? (
          <div className="w-full max-w-7xl mx-auto aspect-video bg-gray-200 rounded-lg animate-pulse"></div>
        ) : mapData?.secondSectionEmbed ? (
          <div className="w-full max-w-7xl mx-auto">
            <div 
              className="w-full aspect-video border rounded-lg overflow-hidden shadow-md mx-auto"
              dangerouslySetInnerHTML={{ __html: mapData.secondSectionEmbed.embedCode }} 
            />
          </div>
        ) : mapData?.imageUrl ? (
          <div className="relative w-full max-w-7xl mx-auto">
            <img
              src={mapData.imageUrl}
              alt="Where is Ele Now"
              className="shadow-md w-full h-auto object-cover"
            />
          </div>
        ) : (
          <div className="relative w-full max-w-7xl mx-auto">
            <img
              src="/About/image 54.svg"
              alt="World Map"
              className="shadow-md w-full h-auto object-cover"
            />
          </div>
        )}
      </section>
    </>
  )
}

export default WhereEle