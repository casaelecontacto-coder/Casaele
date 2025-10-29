import React from "react";
import CmsContent from "../components/CmsContent";
import WhereEle from "../components/About/WhereEle";
import GardenSection from "../components/About/GardenSection";

export default function About() {
  return (
    <>
      <section className="bg-white flex items-center justify-center py-12 sm:py-16 px-4 sm:px-8">
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12">
          
          {/* Left Side: Always show the default image */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-start">
            <img
              src="/About/image 52.svg"
              alt="About Ele Illustration"
              className="w-48 sm:w-72 md:w-[26rem] lg:w-[32rem] xl:w-[34rem]"
            />
          </div>
          
          {/* Right Side Box - Content (text only) */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-end">
            <div className="border-2 border-dashed border-red-400 bg-[#FDF2F2] p-6 sm:p-8 rounded-3xl shadow-sm w-full max-w-xl">
              <CmsContent slug="about-us" showImage={false} />
            </div>
          </div>
        </div>
      </section>

      <WhereEle />
      <GardenSection />
    </>
  );
}