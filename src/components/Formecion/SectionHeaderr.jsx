import React from 'react';
import { GoArrowLeft, GoArrowRight } from "react-icons/go";

const SectionHeaderr = ({ title, onScrollLeft, onScrollRight }) => {
    return (
        <div
            className="
                px-4 sm:px-8 md:px-12 lg:px-16
                mt-8 sm:mt-12 md:mt-16 lg:mt-20
                flex items-center justify-between
            "
        >
            <h2
                className="
                    font-semibold
                    text-lg sm:text-xl md:text-2xl lg:text-3xl
                "
            >
                {title}
            </h2>
            <div className="flex space-x-2">
                <button
                    onClick={onScrollLeft}
                    className="
                        p-2 sm:p-3
                        rounded-full
                        w-8 h-8 sm:w-10 sm:h-10
                        border border-gray-300 hover:border-gray-600
                        shadow-md flex items-center justify-center
                        transition-colors duration-200
                    "
                    aria-label="Scroll Left"
                >
                    <GoArrowLeft className="text-lg sm:text-xl" />
                </button>
                <button
                    onClick={onScrollRight}
                    className="
                        p-2 sm:p-3
                        rounded-full
                        w-8 h-8 sm:w-10 sm:h-10
                        border border-gray-300 hover:border-gray-600
                        shadow-md flex items-center justify-center
                        transition-colors duration-200
                    "
                    aria-label="Scroll Right"
                >
                    <GoArrowRight className="text-lg sm:text-xl" />
                </button>
            </div>
        </div>
    );
};

export default SectionHeaderr;