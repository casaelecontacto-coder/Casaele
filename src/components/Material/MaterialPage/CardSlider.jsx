import Card from "../../Card/Card";
import { forwardRef } from "react";
// *** CHANGED: Re-added Link ***
import { Link } from "react-router-dom"; 

// *** CHANGED: Removed onCardClick prop ***
const CardSlider = forwardRef(({ data }, ref) => {
  return (
    <div
      ref={ref}
      className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
      style={{
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div className="flex flex-nowrap gap-4 sm:gap-6 md:gap-8 px-1 py-4">
        {data.map((material) => (
          // *** CHANGED: Added Link component back ***
          <Link
            to={`/material-detail/${material._id}`}
            key={material._id}
            state={{ material }} // Pass material data in state
            className="snap-start flex-shrink-0 w-[200px] sm:w-[220px] md:w-[250px] lg:w-[300px]"
          >
            {/* *** CHANGED: Removed onClick and cursor-pointer from this div *** */}
            <div>
              <Card {...material} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
});

export default CardSlider;