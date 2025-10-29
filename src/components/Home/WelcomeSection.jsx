import React from "react";
// Make sure you import Link from react-router-dom
import CmsContent from "../CmsContent";
import { Link } from "react-router-dom";

// All your areas are converted into a clean data structure
const clickableAreas = [
  // The format for coords is x1,y1,x2,y2
  // Calculation: left:(x1/width)*100, top:(y1/height)*100, etc.
  { name: "Reading Material", href: "/material", coords: "30,29,272,131" },
  { name: "Grammar Exercises", href: "/material", coords: "341,33,583,135" },
  { name: "The School", href: "/school", coords: "805,36,1047,138" },
  { name: "Ele's Shop", href: "/shop", coords: "18,236,260,338" },
  { name: "Music/Movies", href: "/material", coords: "811,279,1053,381" },
  { name: "Knowledge Vault", href: "/material", coords: "23,548,230,639" },
  { name: "Garden of Ideas", href: "/garden-of-ideas", coords: "816,475,1054,571" },
  { name: "About Ele", href: "/about", coords: "152,657,389,721" },
  { name: "Podcast", href: "/material", coords: "228,753,467,829" },
  { name: "Another Material Link", href: "/material", coords: "861,695,1074,814" },
];

// This function converts pixel coordinates to percentages for CSS
const convertCoordsToStyle = (coords) => {
  const originalWidth = 1086;
  const originalHeight = 869;
  const [x1, y1, x2, y2] = coords.split(',').map(Number);

  return {
    left: `${(x1 / originalWidth) * 100}%`,
    top: `${(y1 / originalHeight) * 100}%`,
    width: `${((x2 - x1) / originalWidth) * 100}%`,
    height: `${((y2 - y1) / originalHeight) * 100}%`,
  };
};


function WelcomeSection() {
  return (
    <section className="px-6 py-12 md:px-12 lg:px-20 bg-white">
      {/* Heading */}
<div className="flex justify-center items-center">
        <CmsContent as="h1" slug="home-welcome-title" prose={false} className="text-2xl md:text-3xl lg:text-4xl font-bold text-black text-center mb-6">
          Welcome to Ele’s House
        </CmsContent>
      </div>
      <div className="flex justify-center items-center text-black">
        <CmsContent as="p" slug="home-welcome-desc" prose={false} className="text-center text-sm md:text-base lg:text-lg max-w-4xl leading-relaxed">
          Ele is as alien to Spanish as you are. But being an adamant alien who wants to understand people & culture, Ele is building a home to learn Spanish.
          <br />
          Good news! It’s open for all curious Spanish learners. Join Ele in CasaDeEle & start your Spanish-learning journey now.
          <br />
          <span className="font-bold">Click on any of the 10+ rooms to get started!</span>
        </CmsContent>
      </div>

      {/* Image Container */}
      <div className="mt-10 flex justify-center">
        <div className="relative w-full max-w-4xl">
          <img
            src="/Home/image 59.svg"
            alt="Ele’s House"
            className="w-full h-auto object-contain"
          />

          {/* Map over the areas and create a responsive Link for each one */}
          {clickableAreas.map((area) => (
            <Link
              key={area.name}
              to={area.href}
              title={area.name}
              // CHANGE: Removed 'hover:backdrop-blur-sm' from this line
              className="absolute transition-all duration-300 rounded-md"
              style={convertCoordsToStyle(area.coords)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default WelcomeSection;