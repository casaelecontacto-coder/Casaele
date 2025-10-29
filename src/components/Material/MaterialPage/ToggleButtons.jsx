  import React from "react";

  function ToggleButtons({ activeButton, setActiveButton }) {
    return (
      <div className="flex justify-center mt-6 sm:mt-8 md:mt-10">
        <div
          className="
            flex bg-gray-100 rounded-full p-1 sm:p-1.5 md:p-2
            shadow-md
          "
        >
          <button
            className={`
              px-3 py-1 text-sm
              sm:px-5 sm:py-2 sm:text-base
              md:px-6 md:py-2 md:text-lg
              rounded-full transition-colors duration-300
              ${
                activeButton === "Explore"
                  ? "bg-red-700 text-white"
                  : "bg-transparent text-black"
              }
            `}
            onClick={() => setActiveButton("Explore")}
          >
            Explore
          </button>

          <button
            className={`
              px-3 py-1 text-sm
              sm:px-5 sm:py-2 sm:text-base
              md:px-6 md:py-2 md:text-lg
              rounded-full transition-colors duration-300
              ${
                activeButton === "Keyword"
                  ? "bg-red-700 text-white"
                  : "bg-transparent text-black"
              }
            `}
            onClick={() => setActiveButton("Keyword")}
          >
            Keyword
          </button>
        </div>
      </div>
    );
  }

  export default ToggleButtons;