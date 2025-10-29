import React from "react";
import Card from "../Card/Card"; // Assuming Card component path

// Default to an empty array to prevent crash if data is loading
function LikeSection({ likecards = [], handleLikeCardClick = () => {} }) {
  return (
    <div className="w-full">
      <h1 className="font-bold text-3xl sm:text-4xl mb-8 text-center">You might also like</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* --- FIX: Change 'card.id' to 'card._id' --- */}
        {likecards.map((card) => (
          <div key={card._id} onClick={() => handleLikeCardClick(card)} className="cursor-pointer">
            {/* The ...card spread will pass 'title', 'price', etc. */}
            <Card {...card} /> 
          </div>
        ))}

      </div>
    </div>
  );
}

export default LikeSection;