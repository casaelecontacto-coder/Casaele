import React, { useState } from "react";

const AboutSection = () => {

  const [activeLevel, setActiveLevel] = useState("basic");

  const textContent = {
    basic: {
      title: "Ele en la Tierra",
      text: "Ele es diferente. No nació como nosotros. Vino de otro lugar y tiene sesenta años, pero parece joven. Vive solo y observa mucho.\nCuando llegó a la Tierra, todo fue raro: hacía calor, había insectos y la comida tenía muchos olores. Ele no entendía nada.\nEn Perú conoció a un hombre especial, un chamán. Él le habló en español y le dio un dulce: un alfajor. Ele sonrió, y esa sonrisa fue nueva para él.\nAhora Ele aprende palabras, baila en la calle y a veces parece una persona. Pero nadie sabe realmente quién es"
    },
    intermediate: {
      title: "Un encuentro inesperado",
      text: "Ele no es un humano común. Llegó un día a la Tierra, cansado y confundido. El calor lo agobiaba y los insectos lo asustaban. Todo era nuevo: los olores, los sabores, las costumbres.\nUn chamán en Perú fue el primero en aceptarlo. Le enseñó palabras en español y en quechua. También le ofreció un alfajor. Ese sabor dulce le provocó una emoción que nunca había sentido antes.\nDesde entonces, Ele observa y aprende. A veces baila, a veces cose ropa, otras veces llora con una película. Quiere entender a los humanos, pero guarda secretos sobre su origen."
    },
    advance: {
      title: "El viajero silencioso",
      text: "Nadie sabe exactamente de dónde viene Ele. No habla mucho de su pasado, solo dice que llegó “de muy lejos”. Su aspecto es extraño, pero suele disimularlo para no llamar demasiado la atención.\nLa Tierra lo desconcierta: el calor lo incomoda, los insectos lo inquietan y la diversidad cultural lo fascina. ¿Por qué algunos animales son adorados y otros comidos? ¿Por qué la gente celebra la vida y la muerte al mismo tiempo?\nEn Perú encontró a un chamán que lo escuchó sin miedo. Ese encuentro le abrió una puerta al idioma español y a nuevas experiencias. Con un simple alfajor, Ele descubrió la alegría.\nDesde entonces camina entre nosotros: baila, observa, llora y ríe, pero siempre guarda un aire de misterio. Ele parece humano… aunque no lo es."
    }
  };

  const currentContent = textContent[activeLevel];

  const getTagClass = (level) => {
    const baseClasses = "px-4 sm:px-5 py-2 border border-gray-400 rounded-full text-gray-700 text-sm font-medium cursor-pointer transition-colors";
    const activeClasses = "bg-gray-100 border-gray-600";
    const inactiveClasses = "hover:bg-gray-100";
    
    return `${baseClasses} ${activeLevel === level ? activeClasses : inactiveClasses}`;
  };

  return (
    <>
      {/* About Ele Section */}
      <section className="bg-white flex items-center justify-center py-12 sm:py-16 px-4 sm:px-8">
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12">
          {/* Left Side Image */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-start">
            <img
              src="/About/image 52.svg"
              alt="A curious, friendly green alien character named Ele"
              className="w-48 sm:w-72 md:w-[26rem] lg:w-[32rem] xl:w-[34rem] h-auto object-contain"
            />
          </div>

          {/* Right Side Box */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-end">
            <div className="border-2 border-dashed border-red-400 bg-[#FDF2F2] p-6 sm:p-8 rounded-3xl shadow-sm text-center md:text-left max-w-xl w-full">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-800 mb-4 sm:mb-6">
                About Ele
              </h1>
              {/* Dynamic Text Section */}
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4">
                {currentContent.title}
              </h2>
              <p className="text-gray-600 whitespace-pre-line leading-relaxed mb-6 sm:mb-8 text-sm sm:text-base md:text-lg">
                {currentContent.text}
              </p>

              {/* Tags */}
              <div className="flex justify-center md:justify-start mt-6">
                <div className="inline-flex flex-wrap justify-center gap-3 sm:gap-4 border border-red-200 bg-red-50 rounded-full px-3 w-full md:w-auto">
                  <button onClick={() => setActiveLevel('basic')} className="px-6 sm:px-8 py-2 text-sm sm:text-base font-medium text-gray-600 hover:bg-red-200 hover:text-black rounded-full transition-all">
                    Basic
                  </button>
                  <button onClick={() => setActiveLevel('intermediate')} className="px-6 sm:px-8 py-2 text-sm sm:text-base font-medium text-gray-600 hover:bg-red-200 hover:text-black rounded-full transition-all">
                    Intermediate
                  </button>
                  <button onClick={() => setActiveLevel('advance')} className="px-6 sm:px-8 py-2 text-sm sm:text-base font-medium text-gray-600 hover:bg-red-200 hover:text-black rounded-full transition-all">
                    Advance
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutSection;
