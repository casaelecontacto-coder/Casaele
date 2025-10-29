import React from "react";
import { useNavigate } from "react-router-dom";
function HeroSection() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col-reverse lg:flex-row items-center px-6 sm:px-12 py-8 bg-white">
      {/* Text Content */}
      <div className="w-full lg:w-1/2 text-center lg:text-left lg:pl-12">
        <h1 className="font-semibold text-4xl sm:text-5xl mb-6 leading-tight">
          What We Offer At <br /> CasaDeELE
        </h1>
        <p className="text-black mb-8 font-medium text-base sm:text-lg">
          We cater to both corporate students and Spanish teachers. Students get contextual, job-focused courses, while teachers gain premium materials to upgrade skills and build long-term students.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
          {/* <button className=" text-[rgba(173,21,24,1)] border border-[rgba(173,21,24,1)] py-4 px-8 rounded-lg w-full sm:w-[280px] hover:bg-[rgba(173,21,24,1)] hover:text-white">
            Book a Call
          </button> */}
          <button onClick={() => navigate('/courses')} className="text-[rgba(173,21,24,1)] border border-[rgba(173,21,24,1)] py-4 px-8 rounded-lg w-full sm:w-[280px] hover:bg-[rgba(173,21,24,1)] hover:text-white">
            Go to courses
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="w-full lg:w-1/2 flex justify-center lg:justify-end mb-8 lg:mb-0">
        <img
          src="/School/image 56.svg"
          alt="Character"
          className="max-w-xs sm:max-w-sm md:max-w-md w-full h-auto"
        />
      </div>
    </div>
  );
}

export default HeroSection;
