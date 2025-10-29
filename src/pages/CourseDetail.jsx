import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ProductImage from '../components/CourseDetail/ProductImage';
import ProductInfo from '../components/CourseDetail/ProductInfo';
import DetailedInfo from '../components/CourseDetail/DetailedInfo';
// KeyFeatures component remains removed
import Reviews from '../components/CourseDetail/Reviews';
import LikeSection from '../components/CourseDetail/LikeSection';
import { apiGet } from '../utils/api';
import Spinner from '../components/Common/Spinner';
import { useCart } from '../context/CartContext'; // Import cart context

function CourseDetail() {
  const { id: courseId } = useParams(); // Get ID from URL parameter
  const location = useLocation(); // To potentially get initial state if navigated from elsewhere
  const navigate = useNavigate(); // For navigation actions (like 'Go to Cart')
  
  // State for the main course being displayed
  const [course, setCourse] = useState(null); // Initialize as null
  const [loading, setLoading] = useState(true);
  
  // State for recommended courses ("You might also like")
  const [recommendedCourses, setRecommendedCourses] = useState([]);

  // State related to cart interaction
  const { addToCart, isItemAdded } = useCart();
  const [quantity, setQuantity] = useState(1); // Quantity selector state
  const [added, setAdded] = useState(false); // State for the "Add/Added" button

  // Effect to fetch course data when the component mounts or the courseId changes
  useEffect(() => {
    setLoading(true); // Start loading indicator
    setCourse(null); // Clear previous course data to ensure reload
    setRecommendedCourses([]); // Clear previous recommendations

    // Fetch the specific course for this detail page
    const fetchCourse = apiGet(`/api/courses/${courseId}`);
    
    // Fetch all courses to find recommendations
    const fetchAllCourses = apiGet('/api/courses');

    Promise.all([fetchCourse, fetchAllCourses])
      .then(([courseData, allCoursesData]) => {
        // Set the main course data
        setCourse(courseData); 
        
        // Filter recommendations: exclude current course, take first 4
        let allCoursesList = [];
        if (Array.isArray(allCoursesData?.courses)) {
           allCoursesList = allCoursesData.courses; // Handle { courses: [...] } structure
        } else if (Array.isArray(allCoursesData)) {
           allCoursesList = allCoursesData; // Handle [...] structure
        }

        const filtered = allCoursesList
          .filter(c => c._id !== courseData._id) // Don't recommend the current course
          .slice(0, 4); // Limit recommendations to 4
        setRecommendedCourses(filtered);

      })
      .catch((err) => {
        console.error("Failed to fetch course data:", err);
        // Handle error, e.g., set an error state or redirect
        setCourse(null); // Ensure course is null if fetch fails
      })
      .finally(() => {
        setLoading(false); // Stop loading indicator
      });
      
  }, [courseId]); // Dependency array: rerun this effect if courseId changes

  // Effect to update the 'added' state based on CartContext when the course loads
  useEffect(() => {
    if (course) {
      // Check if any variant of this course is already in the cart
      setAdded(isItemAdded(course._id)); 
    }
    // Reset quantity whenever the course changes
    setQuantity(1); 
  }, [course, isItemAdded]); // Dependencies: run when course data or cart status changes

  // Function passed to ProductInfo to handle adding the item to the cart
  const handleAddToCart = (itemWithOptions) => {
    // itemWithOptions includes selectedLevel and selectedFormat from ProductInfo
    addToCart({ ...itemWithOptions, quantity }); // Add item with selected quantity
    setAdded(true); // Update button state to "Added!"
    // No automatic navigation here - user clicks the "Go to Cart" button
  };

  // Function passed to LikeSection to handle clicks on recommended courses
  const handleLikeCardClick = (card) => {
    // Navigate to the detail page of the clicked recommended course
    navigate(`/course-detail/${card._id}`); 
    // No need to setCourse(null) here, the useEffect dependency on courseId handles the reload
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

  // Show message if the course fetch failed or returned no data
  if (!course) {
    return (
      <div className="text-center p-20 font-semibold text-gray-700">
        Course not found. It might have been removed or the ID is incorrect.
      </div>
    );
  }

  // Render the main course detail page content
  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-10 bg-gray-50"> {/* Added bg */}
      <div className="w-full max-w-7xl mx-auto pt-10 pb-20">
        {/* Top section: Image and Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-20"> {/* Added mb */}
          <ProductImage 
             item={course} // Pass the fetched course data
          />
          <ProductInfo
            item={course} // Pass the fetched course data (contains availableLevels)
            quantity={quantity}
            setQuantity={setQuantity}
            added={added} // Pass the added state for button display
            handleAddToCart={handleAddToCart} // Pass the handler function
          />
        </div>

        {/* Bottom section: Details, Reviews, Recommendations */}
        <div className="space-y-16 md:space-y-20"> {/* Added space-y */}
          <DetailedInfo
            description={course.description}
            instructor={course.instructor} // Pass relevant details
            // Pass modules if DetailedInfo displays them
            // modules={course.modules} 
          />
          {/* KeyFeatures component remains removed */}
          
          <Reviews 
             courseId={course._id} // Pass courseId for fetching/submitting reviews
          />
          
          <LikeSection 
            likecards={recommendedCourses} // Pass the dynamically fetched recommendations
            handleLikeCardClick={handleLikeCardClick} // Pass the click handler
          />
        </div>
      </div>
    </div>
  );
}

export default CourseDetail;