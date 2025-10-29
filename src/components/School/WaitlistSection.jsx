import React from "react";

function WaitlistSection() {
  const cards = [
    { img: "School/image 8.png", title: "Conversational Group", link: "https://docs.google.com/forms/d/e/1FAIpQLSdlVcX3JEIW0ZIMWvIyanqa3bc3H17ee5gyKhjUkU9MdjM9yg/viewform" },
    { img: "School/image 9.png", title: "1 to 1 corporate batches", link: "https://docs.google.com/forms/d/e/1FAIpQLSfvcjPs3JxRhQLMIoxdZ1kROgQ8vEUXr7CPXEoMXsaWInUsvw/viewform?usp=sharing&ouid=112274896336544812917" },
    { img: "School/image 10.png", title: "Group corporate batches", link: "https://docs.google.com/forms/d/e/1FAIpQLSfIGmqGZU7D3mwvOGJxv2QqtBaBw6frYPCZWAg9-CX2pJbFzQ/viewform?usp=sharing&ouid=112274896336544812917" },
  ];
  return (
    <div className="text-center bg-[#FDF2F2] py-12">
      <h1 className="text-4xl md:text-5xl font-semibold mb-10 px-4">
        Join the waitlist
      </h1>

      <div className="flex flex-wrap justify-center gap-6 md:gap-10 px-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-lg flex flex-col w-full sm:w-[45%] md:w-[30%] max-w-xs"
          >
            <img
              src={card.img}
              alt={card.title}
              className="w-full object-cover rounded-t-lg mb-4"
            />
            <div className="px-4 pb-6 flex flex-col flex-1">
              <h2 className="text-2xl font-semibold text-left mb-2">
                {card.title}
              </h2>
              <p className="text-black font-light text-base mb-6 text-left">
                Ipsum is simply dummy text of the printing and
              </p>
              <a
                href={card.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[rgba(173,21,24,1)] text-white py-2 px-6 rounded-lg w-full hover:bg-red-700 transition text-xl mt-auto text-center"
              >
                Join the waitlist!
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WaitlistSection;