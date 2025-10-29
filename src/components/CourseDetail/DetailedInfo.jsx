import React from "react";

function DetailedInfo({ item }) {
  return (
    <div className="w-full">
      <h1 className="font-bold text-3xl sm:text-4xl mb-6">Detailed information</h1>
      <div className="space-y-4 text-gray-600 text-base leading-relaxed">
        <p>
          {item?.description || "No detailed description available."}
        </p>
      </div>
    </div>
  );
}

export default DetailedInfo;