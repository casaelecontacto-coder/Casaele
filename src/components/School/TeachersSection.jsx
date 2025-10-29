import React from "react";

function MeetTeachers() {
  const teachers = [
    { img: "/Steve.svg", name: "Steve K." },
    { img: "/Jeremy.svg", name: "Jeremy Sil" },
    { img: "/Theri.svg", name: "Theri Jacobs" },
    { img: "/Amrit.svg", name: "Amrit Goyal" },
  ];

  return (
    <div className="w-full bg-pink-200 py-16 relative mt-28">
      <h1 className="text-center font-semibold text-4xl md:text-5xl mb-12">Meet Our Teachers</h1>
      <div className="flex justify-center flex-wrap gap-10 px-4">
        {teachers.map((t, i) => (
          <div key={i} className="flex flex-col items-center w-[234px] text-center">
            <img src={t.img} alt={t.name} className="w-24 h-24 rounded-full mb-3" />
            <h2 className="font-semibold text-base">{t.name}</h2>
            <p className="text-sm text-gray-600 mt-2">ellentesque sed. Ornare suspendisse ut ac neque lobortis sed tincidunt.</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MeetTeachers;
