import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ProductImage from '../components/CourseDetail/ProductImage'; // Reusing component
import ProductInfo from '../components/CourseDetail/ProductInfo';   // Reusing component
import DetailedInfo from '../components/CourseDetail/DetailedInfo'; // Reusing component
// KeyFeatures is removed
import Reviews from '../components/CourseDetail/Reviews';           // Reusing component (needs modification later for product reviews)
import LikeSection from '../components/CourseDetail/LikeSection';   // Reusing component (needs modification later for related products)
import { apiGet } from '../utils/api';
import Spinner from '../components/Common/Spinner';
import { useCart } from '../context/CartContext'; // Import cart context

function ProductDetail() {
  const { id: productId } = useParams(); // Get product ID from URL parameter
  const location = useLocation(); // To potentially get initial state
  const navigate = useNavigate(); // For navigation actions

  // State for the main product being displayed
  const [product, setProduct] = useState(null); // Initialize as null
  const [loading, setLoading] = useState(true);

  // State for recommended products ("You might also like")
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  // State related to cart interaction
  const { addToCart, isItemAdded } = useCart();
  const [quantity, setQuantity] = useState(1); // Quantity selector state
  const [added, setAdded] = useState(false); // State for the "Add/Added" button

  // Effect to fetch product data when the component mounts or the productId changes
  useEffect(() => {
    setLoading(true); // Start loading indicator
    setProduct(null); // Clear previous product data
    setRecommendedProducts([]); // Clear previous recommendations

    // Fetch the specific product for this detail page
    const fetchProduct = apiGet(`/api/products/${productId}`);

    // Fetch all products to find recommendations
    const fetchAllProducts = apiGet('/api/products');

    Promise.all([fetchProduct, fetchAllProducts])
      .then(([productData, allProductsData]) => {

        // Set the main product data
        // Ensure it has a 'title' prop if ProductInfo expects it (use 'name' as fallback)
        setProduct({ ...productData, title: productData.name || productData.title });

        // Filter recommendations: exclude current product, take first 4
        let allProductsList = [];
         if (Array.isArray(allProductsData?.products)) {
           allProductsList = allProductsData.products; // Handle { products: [...] } structure
        } else if (Array.isArray(allProductsData)) {
           allProductsList = allProductsData; // Handle [...] structure
        }

        const filtered = allProductsList
          .filter(p => p._id !== productData._id) // Don't recommend the current product
          .slice(0, 4); // Limit recommendations to 4
        setRecommendedProducts(filtered);

      })
      .catch((err) => {
        console.error("Failed to fetch product data:", err);
        setProduct(null); // Ensure product is null if fetch fails
      })
      .finally(() => {
        setLoading(false); // Stop loading indicator
      });

  }, [productId]); // Dependency array: rerun this effect if productId changes

  // Effect to update the 'added' state based on CartContext when the product loads
  useEffect(() => {
    if (product) {
      // Check if any variant of this product is already in the cart
      setAdded(isItemAdded(product._id));
    }
    // Reset quantity whenever the product changes
    setQuantity(1);
  }, [product, isItemAdded]); // Dependencies: run when product data or cart status changes

  // Function passed to ProductInfo to handle adding the item to the cart
  const handleAddToCart = (itemWithOptions) => {
    // itemWithOptions includes selectedLevel and selectedFormat from ProductInfo
    addToCart({ ...itemWithOptions, quantity }); // Add item with selected quantity
    setAdded(true); // Update button state to "Added!"
    // No automatic navigation
  };

  // Function passed to LikeSection to handle clicks on recommended products
  const handleLikeCardClick = (card) => {
    // Navigate to the detail page of the clicked recommended product
    navigate(`/product-detail/${card._id}`);
  };

  // --- Render Logic ---

  // Show loading spinner while data is fetching
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner />
      </div>
    );
  }

  // Show message if the product fetch failed or returned no data
  if (!product) {
    return (
      <div className="text-center p-20 font-semibold text-gray-700">
        Product not found. It might have been removed or the ID is incorrect.
      </div>
    );
  }

  // Render the main product detail page content
  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-10 bg-gray-50"> {/* Added bg */}
      <div className="w-full max-w-7xl mx-auto pt-10 pb-20">
        {/* Top section: Image and Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-20"> {/* Added mb */}
          <ProductImage
             item={product} // Pass the fetched product data (contains imageUrl or images/thumbnail)
          />
          <ProductInfo
            item={product} // Pass the fetched product data (contains availableLevels)
            quantity={quantity}
            setQuantity={setQuantity}
            added={added} // Pass the added state for button display
            handleAddToCart={handleAddToCart} // Pass the handler function
          />
        </div>

        {/* Bottom section: Details, Reviews, Recommendations */}
        <div className="space-y-16 md:space-y-20"> {/* Added space-y */}
          <DetailedInfo
            description={product.description}
            // Products likely don't have an instructor, pass undefined or null
            // The DetailedInfo component should handle this gracefully (e.g., hide the instructor part)
            instructor={product.instructor} 
          />
          {/* KeyFeatures component remains removed */}

          {/* Note: Reviews component currently uses courseId prop. 
              This will fetch reviews based on the product's _id.
              Ensure your Review model/API can handle reviews linked to products.
              You might need to update the Review backend later.
          */}
          <Reviews
             courseId={product._id} // Pass productId here, component expects 'courseId' prop name
          />

          <LikeSection
            likecards={recommendedProducts} // Pass the dynamically fetched recommendations
            handleLikeCardClick={handleLikeCardClick} // Pass the click handler
          />
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;