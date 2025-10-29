import React, { useState } from "react";
import { FaAngleDown } from "react-icons/fa";

function FAQSection() {
  const [active, setActive] = useState(null);

  const faqData = [
    { q: "1. What platform do you use for online classes?", a: "We utilize interactive platforms like Google classroom, Genially, Google meets, Zoom with whiteboards, multimedia tools, and co-browsing capabilities. No additional software installation is required - everything runs through your web browser for seamless access. Our teachers help you understand the online tools and understand that it can be a challenge at the start, especially for students aged 60+." },
    { q: "2. Are there any materials I need to buy?", a: "No! All learning materials are included in your course fees. We provide comprehensive resources, including interactive exercises, audio materials, cultural content, and practice activities to support all language skills. We do recommend books if the student is interested in buying a physical version." },
    { q: "3. Do you offer placements or job opportunities?", a: "We teach professionals who are already working in their industries and want to learn Spanish as an added skill. However, if you are currently unemployed, we will make you capable enough to pass an interview and provide you with employment suggestions that tell you about possible job opportunities in the market." },
    { q: "4. Do you offer only corporate Spanish courses?", a: "No, we offer other courses on a need basis. We specialize in 100% online courses for highly motivated students. These courses are launched frequently and have a totally different methodology. For more information, you can contact us and subscribe to our newsletter to receive updates about the latest course." },
    { q: "5. What are the qualifications of your teachers?", a: "All our instructors hold specialized diplomas or master's degrees in teaching Spanish as a Foreign Language (ELE) and have more than 5 years of online Spanish teaching experience, ensuring they are experts in virtual education and digital engagement techniques. We firmly believe that all Spanish teachers require proper training, whether they are native speakers or non-native speakers, as natural fluency does not automatically translate to effective teaching ability. Our rigorous qualification standards ensure every instructor has mastered Spanish language pedagogy, cultural sensitivity, assessment techniques, and student engagement strategies specific to foreign learners." },
  ];

  return (
    <div className="mb-16 px-4 py-12">
      <h1 className="text-center font-semibold text-4xl md:text-5xl">
        Frequently Asked Questions
      </h1>
      <div className="mt-8 max-w-7xl mx-auto">
        {faqData.map((faq, i) => (
          <div
            key={i}
            className="border-b border-gray-300 py-4"
          >
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setActive(active === i ? null : i)}
            >
              {/* Question text zyada width lega */}
              <p className="text-lg font-medium flex-1 pr-6">{faq.q}</p>
              <FaAngleDown
                className={`text-xl transform transition-transform duration-300 ${active === i ? "rotate-180" : ""
                  }`}
              />
            </div>
            {active === i && (
              <p className="mt-2 text-gray-600 leading-relaxed">{faq.a}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FAQSection;
