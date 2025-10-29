import HeroSection from "../components/Home/HeroSection";
import WelcomeSection from "../components/Home/WelcomeSection";
import PicksSection from "../components/Home/PicksSection";
import HowWeHelp from "../components/Home/HowWeHelp";
import Testimonials from "../components/Home/Testimonials";
import TestimonialForm from "../components/Home/TestimonialForm";
import ExperienceSpanish from "../components/Home/ExperienceSpanish";

function Home() {
  return (
    <>
      <HeroSection />
      <WelcomeSection />
      <PicksSection />
      <HowWeHelp />
      <ExperienceSpanish />
      <Testimonials />
      <TestimonialForm />
    </>
  );
}

export default Home;
