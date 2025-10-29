// src/components/Material/MaterialDetail/DropDown.jsx
import React, { useState } from "react";
import { FaAngleDown } from "react-icons/fa";

// Accept 'title' as a prop
function DropDown({ title = "Ejercicios", exercises = [] }) { // Default title if prop not passed
  const [active, setActive] = useState(null);

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        {/* Use the title prop here */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-0">
          {title} {/* <-- Display the title */}
        </h1>
      </div>

      <div className="space-y-4">
        {exercises.map((item, i) => (
          // ... rest of the dropdown item mapping ...
             <div key={item._id || i} className="border border-gray-200 rounded-xl p-4 sm:p-5">
            <div
              className="flex items-center justify-between cursor-pointer gap-4"
              onClick={() => setActive(active === i ? null : i)}
            >
              <div className="flex items-center gap-4">
                <img src={item.type === 'AI' ? "/Material/cartoon1.svg" : "/Material/cartoon2.svg"} alt="icon" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                <p className="text-base font-medium text-gray-800">{item.title}</p>
              </div>
              <FaAngleDown
                className={`text-xl text-gray-500 transition-transform duration-300 flex-shrink-0 ${active === i ? "rotate-180" : ""}`}
              />
            </div>

            {active === i && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <div dangerouslySetInnerHTML={{ __html: item.embedCode }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DropDown;