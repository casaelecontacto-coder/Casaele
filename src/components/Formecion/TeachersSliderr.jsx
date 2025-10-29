import React, { useState, useEffect } from 'react';
import { GoArrowLeft, GoArrowRight } from "react-icons/go";

const TeachersSliderr = ({ teachers }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerRow, setItemsPerRow] = useState(4);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width >= 1024) setItemsPerRow(4);
            else if (width >= 768) setItemsPerRow(2);
            else setItemsPerRow(1);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const prev = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? Math.max(0, teachers.length - itemsPerRow) : prevIndex - 1
        );
    };

    const next = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex >= teachers.length - itemsPerRow ? 0 : prevIndex + 1
        );
    };

    const visibleTeachers = teachers.slice(
        currentIndex,
        currentIndex + itemsPerRow
    );

    return (
        <div className="w-full bg-[#FDF2F2] mb-16 py-24 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto text-center">
                <h1 className="font-bold text-4xl sm:text-5xl text-gray-800 mb-20">
                    Meet Our Teachers
                </h1>
                <div className="relative flex items-center justify-center px-6 sm:px-24">
                    <button
                        onClick={prev}
                        className="absolute left-0 top-1/2 -translate-y-1/2 bg-transparent border border-gray-400 rounded-full p-3 shadow-sm hover:bg-white/50 transition-colors z-10"
                        aria-label="Previous Teachers"
                    >
                        <GoArrowLeft className="text-gray-500 text-2xl" />
                    </button>
                    <div className="flex gap-4 md:gap-6 w-full justify-center overflow-hidden">
                        {visibleTeachers.map((teacher, index) => (
                            <div
                                key={index}
                                className="flex flex-col items-center text-center px-2 transition-transform duration-300"
                                style={{ flex: `0 0 calc(${100 / itemsPerRow}% - 1rem)` }}
                            >
                                <img
                                    src={teacher.img}
                                    alt={teacher.name}
                                    className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full mb-6 object-cover shadow-md"
                                />
                                <div className="w-2/3 border-t border-gray-300 mb-6"></div>
                                <h2 className="font-semibold text-xl sm:text-2xl text-gray-800">
                                    {teacher.name}
                                </h2>
                                <p className="text-sm sm:text-base text-gray-500 mt-3 px-2">
                                    {teacher.description}
                                </p>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={next}
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-transparent border border-gray-400 rounded-full p-3 shadow-sm hover:bg-white/50 transition-colors z-10"
                        aria-label="Next Teachers"
                    >
                        <GoArrowRight className="text-gray-500 text-2xl" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeachersSliderr;