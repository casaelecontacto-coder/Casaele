import React from "react";

function KeyFeatures() {
  const features = [
    "Focused Theme", "Visual Learning", "Native Audio", "Boost Vocabulary", "Cultural Insights", "Interactive", "Focused Theme", "Visual Learning", "Native Audio", "Boost Vocabulary", "Cultural Insights", "Interactive"
  ];
  return (
    <div className="w-full">
      <h2 className="font-bold text-2xl mb-4">Key Features:</h2>
      <div className="flex flex-wrap gap-3">
        {features.map((f, i) => (
          <span key={i} className="bg-[#FDF2F2] text-gray-800 px-4 py-2 rounded-full text-sm font-medium">
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

export default KeyFeatures;