import React from 'react';
import { useCurrency } from '../../context/CurrencyContext';

const Card = ({ image, title, description, tags, price, discountPrice, prices, onClick }) => {
    const { getCurrencySymbol, currency } = useCurrency();

    // Get currency-aware prices
    const currentPrice = prices?.[currency]?.price || price || 0;
    const currentDiscountPrice = prices?.[currency]?.discountPrice || discountPrice || 0;
    const hasDiscount = currentDiscountPrice > 0 && currentDiscountPrice < currentPrice;

    return (
        <div className="bg-white rounded-lg shadow-md w-full overflow-hidden">
            <img
                src={image}
                alt={title}
                className="w-full h-48 sm:h-52 md:h-56 lg:h-60 object-cover rounded-t-lg"
                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x300/e5e7eb/4b5563?text=Image+Not+Found"; }}
            />
            <div className="p-3">
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-sm text-gray-600 mb-3">{description}</p>
                {tags && Array.isArray(tags) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {tags.map((tag, idx) => (
                            <span
                                key={idx}
                                className="text-xs bg-pink-100 rounded-full px-3 py-1 text-gray-500"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
                {(typeof price === "number" || typeof currentPrice === "number") && currentPrice > 0 && (
                    <div className="flex items-center gap-2">
                        {hasDiscount ? (
                            <>
                                <span className="text-md font-semibold text-gray-800">{getCurrencySymbol()}{currentDiscountPrice}</span>
                                <span className="text-sm text-gray-400 line-through">{getCurrencySymbol()}{currentPrice}</span>
                            </>
                        ) : (
                            <span className="text-md font-semibold text-gray-800">{getCurrencySymbol()}{currentPrice}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Card;