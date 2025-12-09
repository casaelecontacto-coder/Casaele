import React from "react";
import Card from "../Card/Card"; // Assuming Card component path

// Default to an empty array to prevent crash if data is loading
function LikeSection({ likecards = [], handleLikeCardClick = () => {} }) {
  return (
    <div className="w-full">
      <h1 className="font-bold text-3xl sm:text-4xl mb-8 text-center">You might also like</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* --- FIX: Change 'card.id' to 'card._id' and ensure proper image mapping --- */}
        {likecards.map((card) => (
          <div key={card._id} onClick={() => handleLikeCardClick(card)} className="cursor-pointer">
            {/* Map course data to Card props, ensuring images array is passed correctly */}
            <Card 
              {...card}
              images={card.images} // Explicitly pass images array
              imageUrls={card.imageUrls} // Explicitly pass imageUrls array
              thumbnail={card.thumbnail} // Explicitly pass thumbnail
            /> 
          </div>
        ))}

      </div>
    </div>
  );
}

export default LikeSection;