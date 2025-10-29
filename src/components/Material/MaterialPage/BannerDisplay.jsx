import React from 'react';

function BannerDisplay({ banner }) {
  const content = (
    <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden shadow-lg group">
      <img
        src={banner.imageUrl}
        alt={banner.title}
        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-6 sm:p-8 text-white">
        <h3 className="text-2xl sm:text-3xl font-bold">{banner.title}</h3>
        {banner.caption && <p className="mt-2 text-sm sm:text-base opacity-90 max-w-lg">{banner.caption}</p>}
      </div>
    </div>
  );

  // If the banner has a link, wrap it in an anchor tag
  if (banner.link) {
    return (
      <a href={banner.link} target="_blank" rel="noopener noreferrer" className="block my-8 md:my-12">
        {content}
      </a>
    );
  }

  // Otherwise, just display it in a div
  return <div className="my-8 md:my-12">{content}</div>;
}

export default BannerDisplay;