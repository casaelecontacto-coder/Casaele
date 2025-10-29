import React, { forwardRef } from 'react';
import Card from './Card';

const CardSlider = forwardRef(({ data }, ref) => {
    return (
        <div className="relative px-4 sm:px-6 md:px-10 lg:px-16 mt-4 sm:mt-6 md:mt-8">
            <div
                ref={ref}
                className="flex space-x-4 sm:space-x-6 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
            >
                {data.map((material, index) => (
                    <div key={index} className="snap-start flex-shrink-0 w-[280px] sm:w-[320px]">
                        <Card
                            image={material.image}
                            title={material.title}
                            description={material.description}
                            tags={material.tags}
                            price={material.price}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
});

export default CardSlider;