import React, { useRef } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import Card from "../../Card/Card";

function RelatedMaterials({ materials, onCardClick }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    const container = scrollRef.current;
    if (!container) return;

    const firstCard = container.querySelector(".snap-center"); // Updated selector
    if (!firstCard) return;

    const cardStyle = window.getComputedStyle(firstCard);
    const cardMargin = parseFloat(cardStyle.marginRight) || parseFloat(cardStyle.marginLeft);
    const scrollAmount = firstCard.offsetWidth + cardMargin;

    container.scrollBy({
      left: dir === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-0">
          Actividades Relacionadas
        </h1>
        <div className="flex space-x-3">
          <button onClick={() => scroll("left")} className="p-3 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors">
            <FaArrowLeft />
          </button>
          <button onClick={() => scroll("right")} className="p-3 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors">
            <FaArrowRight />
          </button>
        </div>
      </div>

      {/* Card Slider - Updated for better snapping */}
      <div 
        ref={scrollRef} 
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pb-4"
      >
        {materials.map((card, i) => (
          <div 
            key={i} 
            className="snap-center flex-shrink-0 w-5/6 sm:w-1/2 md:w-1/3 lg:w-1/4" 
            onClick={() => onCardClick && onCardClick(card)}
          >
            <Card
              image={card.image}
              title={card.title}
              description={card.description}
              tags={card.tags}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default RelatedMaterials;