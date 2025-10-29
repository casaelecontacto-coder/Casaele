import React from "react";

const StatItem = ({ value, label }) => (
  <div className="text-center lg:text-left">
    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{value}</h2>
    <p className="text-gray-500 text-sm mt-1">{label}</p>
  </div>
);

function Banner() {
  return (
    // The main section is now the positioning container for the image
    <section className="bg-white relative">
      {/* Wrapper for all the text content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 lg:w-3/5 py-16 sm:py-24">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Tienda Casa de ELE
            </h1>

            <p className="mt-4 text-gray-600 text-lg max-w-lg mx-auto lg:mx-0">
              Discover creative and inclusive Spanish resources for learners
              and teachers. All digital downloads and subscriptions designed
              with real classroom experience.
            </p>

            <button className="my-10 bg-[rgba(173,21,24,1)] text-white py-3 px-12 rounded-xl text-lg font-semibold hover:bg-red-700 transition-colors duration-300 shadow-md">
              Shop Now
            </button>
          </div>

          {/* Stats Section */}
          <div className="flex flex-wrap justify-center lg:justify-start items-center gap-x-8 gap-y-4">
            <StatItem value="200+" label="International Brands" />
            <div className="hidden sm:block h-12 w-px bg-gray-200"></div>
            <StatItem value="2,000+" label="High-Quality Products" />
            <div className="hidden sm:block h-12 w-px bg-gray-200"></div>
            <StatItem value="30,000+" label="Happy Customers" />
          </div>
        </div>
      </div>

      {/* Right Mascot - positioned absolutely to the section */}
      <div className="hidden lg:block absolute top-1/2 right-0 -translate-y-1/2">
        <img
          src="/Shop/shop.svg"
          alt="An illustration of the cute alien mascot Ele waving"
          className="w-[500px] h-auto object-contain"
        />
      </div>
    </section>
  );
}

export default Banner;