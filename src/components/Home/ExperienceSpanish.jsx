function ExperienceSpanish() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
      {/* Heading */}
      <h1 className="text-center font-bold text-2xl sm:text-3xl md:text-4xl mb-8 md:mb-12 text-black">
        We help you experience Spanish!
      </h1>

      {/* Paragraph + Image Side-by-Side */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-10 md:gap-12">
        {/* Left Paragraph */}
        <div className="w-full md:w-2/3 text-gray-800 text-base md:text-[17px] leading-relaxed font-medium">
          <p>
            Sometimes learning a language doesn’t come naturally, we all feel alien. Ele, an alien also feels like you—a stranger exploring Spanish without barriers. Our motive is to help you experience Spanish through Ele’s Journey..
          </p>
          <br />
          <p>
            We welcome diverse Spanish dialects, LGBTQ+ voices, and Indigenous and Afrodescendant cultures, with a focus on real-life experiences, emotional connection, and cultural empathy. We offer personalized, contextual learning through storytelling and interactive projects led by trained multilingual and native teachers.
          </p>
          <br />
          <p>
            Ele is a lifelong learner who represents the struggles of a Spanish student, minorities and neurodiverse learners, creating an inclusive community to join your Spanish journey.
          </p>
        </div>

        {/* Right Image */}
        <div className="w-full md:w-1/3 flex justify-center">
          <img
            src="/Home/a-side-by-side-comic-style-illustration--on-the-le 1.jpg"
            alt="Spanish journey"
            className="w-full max-w-[434px] h-auto rounded-md object-contain"
          />
        </div>
      </div>
    </div>
  );
}

export default ExperienceSpanish;
