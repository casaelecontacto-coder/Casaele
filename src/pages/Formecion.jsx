import React, { useRef, useState, useEffect } from "react";
import material from "../components/Material/MaterialDetail/material";
import mostlyliked from "../components/Material/MaterialPage/mostlyliked";
import { GoArrowLeft, GoArrowRight } from "react-icons/go";
import Testimonials from "../components/Home/Testimonials";

// Corrected import paths
import Card from "../components/Formecion/Card";
import SectionHeader from "../components/Formecion/SectionHeaderr";
import CardSlider from "../components/Formecion/CardSlider";
import TeachersSlider from "../components/Formecion/TeachersSliderr";

const Formacion = () => {
    const webinarsRef = useRef(null);
    const coursesRef = useRef(null);

    const partners = [
        { img: "/School/669fab92f9f5f07cc3e09ef8_logo-method.svg.svg", alt: "Partner 1" },
        { img: "/School/669fab9ea5868389244b7417_logo-recall.svg fill.svg", alt: "Partner 2" },
        { img: "/School/67b0ce85c98b23813ae581d4_logo-bambuser.svg fill.svg", alt: "Partner 3" },
        { img: "/School/66cdfcbe778e42d9f068993c_logo-veed.svg fill.svg", alt: "Partner 4" },
        { img: "/School/669fabd7fc0afa2e80be301f_logo-alan.svg.svg", alt: "Partner 5" },
        { img: "/School/67aa69ac4b01577f54ae91e3_logo-citibank.svg.svg", alt: "Partner 6" },
        { img: "/School/67b0ce5dbb0e44bc6109ad7c_logo-attention.svg.svg", alt: "Partner 7" },
    ];

    const teachers = [
        { img: "/School/unsplash_DH_u2aV3nGM.svg", name: "Steve K.", description: "ellentesque sed. Ornare suspendisse ut ac neque lobortis sed tincidunt." },
        { img: "/School/unsplash_DH_u2aV3nGM (1).svg", name: "Jeremy Sil", description: "ellentesque sed. Ornare suspendisse ut ac neque lobortis sed tincidunt." },
        { img: "/School/unsplash_DH_u2aV3nGM (2).svg", name: "Theri Jacobs", description: "ellentesque sed. Ornare suspendisse ut ac neque lobortis sed tincidunt." },
        { img: "/School/unsplash_DH_u2aV3nGM (3).svg", name: "Amrit Goyal", description: "ellentesque sed. Ornare suspendisse ut ac neque lobortis sed tincidunt." },
        { img: "/School/unsplash_DH_u2aV3nGM (1).svg", name: "Alice R.", description: "ellentesque sed. Ornare suspendisse ut ac neque lobortis sed tincidunt." },
        { img: "/School/unsplash_DH_u2aV3nGM (2).svg", name: "Bob M.", description: "ellentesque sed. Ornare suspendisse ut ac neque lobortis sed tincidunt." },
    ];

    const handleScroll = (ref, direction) => {
        if (ref.current && ref.current.children.length > 0) {
            const card = ref.current.children[0];
            const gap = parseInt(window.getComputedStyle(ref.current).gap, 10) || 24;
            const scrollAmount = card.offsetWidth + gap;

            if (direction === "left") {
                ref.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-800 pb-16">
            <header className="py-8 sm:py-10 md:py-12 bg-white flex flex-col items-center">
                <h1 className="text-3xl mb-4 sm:text-4xl md:text-5xl font-bold">
                    Formación
                </h1>
                <div className="mt- sm:mt-8 relative w-11/12 sm:w-4/5 md:w-3/5 lg:w-2/5">
                    <input
                        type="text"
                        placeholder="Explore"
                        className="w-full py-3 pl-6 pr-12 rounded-2xl shadow-md border border-gray-300 focus:outline-none focus:ring-2   focus:ring-[rgba(173,21,24,1)]"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-600 rounded-full">
                        <img
                            src="/Searchbar/Button.svg"
                            alt="Search"
                            className="h-9 w-9"
                        />
                    </button>
                </div>
            </header>

            <div className="-mt-12">
                <SectionHeader
                    title="Webinars"
                    onScrollLeft={() => handleScroll(webinarsRef, "left")}
                    onScrollRight={() => handleScroll(webinarsRef, "right")}
                />
                <CardSlider ref={webinarsRef} data={mostlyliked} />
            </div>

            <div className="mt-6  sm:mt-8 md:mt-10">
                <SectionHeader
                    title="Courses (Certificates awarded)"
                    onScrollLeft={() => handleScroll(coursesRef, "left")}
                    onScrollRight={() => handleScroll(coursesRef, "right")}
                />
                <CardSlider ref={coursesRef} data={material} />
            </div>

            <div className="mt-20 mb-24 px-4 text-center py-8">
                <h1 className="text-5xl font-semibold mb-6">Institutions we collaborate With</h1>
                <p className="max-w-3xl mx-auto text-gray-500 text-base font-medium mb-10">
                    ntium voluptatum deleniti atque corrupti quos dolores et quas molestias
                    excepturi sint occaecati cupiditate non provident, similique sunt in culpa
                    quintium voluptatum deleniti atque corr
                </p>
                <div className="flex flex-wrap justify-center items-center gap-8">
                    {partners.map((partner, i) => (
                        <img
                            key={i}
                            src={partner.img}
                            alt={partner.alt}
                            className="w-40 sm:w-18 md:w-28 lg:w-32 h-auto object-contain"
                        />
                    ))}
                </div>
            </div>

            <TeachersSlider teachers={teachers} />

            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            <Testimonials />
        </div>
    );
};

export default Formacion;