import React from "react";

function WhoWeWorkWith() {
  // Academic credentials - three institutions
  const academicInstitutions = [
    { img: "/School/Academic-icon-1.jpg", alt: "Instituto Cervantes" },
    { img: "/School/academic-icon-2.jpg", alt: "Instituto caro y cuervo" },
    { img: "/School/academic-icon-3.jpg", alt: "Doon University" },
  ];

  return (
    <div className="mt-20 px-4 text-center py-8">
      <h1 className="text-5xl font-semibold mb-6">Academic credentials</h1>
      {/* Description removed as per client request */}

      <div className="flex flex-wrap justify-center items-center gap-8">
        {academicInstitutions.map((institution, i) => (
          <img
            key={i}
            src={institution.img}
            alt={institution.alt}
            className="w-40 sm:w-18 md:w-28 lg:w-32 h-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
          />
        ))}
      </div>
    </div>
  );
}

export default WhoWeWorkWith;
