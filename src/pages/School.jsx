import React from "react";
import SchoolHeroSection from "../components/School/SchoolHeroSection";
import WaitlistSection from "../components/School/WaitlistSection";
import WhoWeWork from "../components/School/WhoWeWork";
import HowWeProvide from "../components/School/HowWeProvide";
import SchoolSteps from "../components/School/SchoolSteps";
import MeetTeachers from "../components/School/MeetTeachers";
import FAQSection from "../components/School/FAQSection";
import Testimonials from "../components/Home/Testimonials";
import SuggestionsSection from "../components/Home/SuggestionsSection";

function Schoolpage() {
  return (
    <>
      <SchoolHeroSection />
      <WaitlistSection />
      <WhoWeWork />
      <HowWeProvide />
      <SchoolSteps />
      <MeetTeachers />
      <Testimonials />
      <SuggestionsSection />
      <FAQSection />
    </>
  );
}

export default Schoolpage;
