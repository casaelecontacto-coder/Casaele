import React from "react";

function WhoWeWorkWith() {
  const partners = [
    { img: "/School/669fab92f9f5f07cc3e09ef8_logo-method.svg.svg", alt: "Partner 1" },
    { img: "/School/669fab9ea5868389244b7417_logo-recall.svg fill.svg", alt: "Partner 2" },
    { img: "/School/67b0ce85c98b23813ae581d4_logo-bambuser.svg fill.svg", alt: "Partner 3" },
    { img: "/School/66cdfcbe778e42d9f068993c_logo-veed.svg fill.svg", alt: "Partner 4" },
    { img: "/School/669fabd7fc0afa2e80be301f_logo-alan.svg.svg", alt: "Partner 5" },
    { img: "/School/67aa69ac4b01577f54ae91e3_logo-citibank.svg.svg", alt: "Partner 5" },
    { img: "/School/67b0ce5dbb0e44bc6109ad7c_logo-attention.svg.svg", alt: "Partner 5" },
  ];

  return (
    <div className="mt-20 px-4 text-center py-8">
      <h1 className="text-5xl font-semibold mb-6">Who We Work With</h1>
      <p className="max-w-3xl mx-auto text-gray-500 text-base font-medium mb-10">
        ntium voluptatum deleniti atque corrupti quos dolores et quas molestias
        excepturi sint occaecati cupiditate non provident, similique sunt in culpa
        quintium voluptatum deleniti atque corr
      </p>

      <div className="flex flex-wrap justify-center items-center gap-8">
        {partners.map((partner, i) => (
          <img
            key={i}
            src={partner.img}
            alt={partner.alt}
            className="w-40 sm:w-18 md:w-28 lg:w-32 h-auto object-contain"
          />
        ))}
      </div>
    </div>
  );
}

export default WhoWeWorkWith;
