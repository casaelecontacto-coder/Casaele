import React from "react";

function SchoolSteps() {
  return (
    <div className="mt-10 md:mt-20 px-4 py-6 md:py-12">
      <h1 className="text-3xl md:text-5xl font-semibold mb-6 md:mb-12 text-center">
        How CasaDeEle (School) works
      </h1>

      {/* Image wrapper */}
      <div className="flex justify-center">
        <img
          src="/School/Frame 1000012130.svg"
          alt="School Steps"
          className="w-full max-w-5xl h-auto px-2 mb-6"
        />
      </div>
    </div>
  );
}

export default SchoolSteps;
