import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import React, { useEffect, Suspense, lazy } from 'react';
import { auth } from './firebase';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// --- Static Imports (Critical for initial load) ---
import Header from "./components/CommonPage/Header";
import Footer from "./components/CommonPage/Footer";
import Newsletter from "./components/CommonPage/Newsletter";
import ScrollToTop from "./pages/ScrollToTop";
import DisableContextMenu from "./components/Common/DisableContextMenu";
import Spinner from "./components/Common/Spinner";

// --- Lazy Load User Pages ---
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const School = lazy(() => import("./pages/School"));
const MaterialPage = lazy(() => import("./pages/MaterialPage"));
const MaterialDetail = lazy(() => import("./pages/MaterialDetail"));
const CoursesPage = lazy(() => import("./pages/CoursesPage"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const CartCheckout = lazy(() => import("./pages/CartCheckout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const Garden = lazy(() => import("./pages/GardenOfIdeas"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const CmsPage = lazy(() => import("./pages/CmsPage"));

// --- Lazy Load Admin Pages (Heavy components) ---
const AdminLayout = lazy(() => import("./components/Admin/AdminLayout"));
const RequireAuth = lazy(() => import("./components/Admin/RequireAuth"));
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const UsersPage = lazy(() => import("./pages/admin/Users"));
const Products = lazy(() => import("./pages/admin/Products"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const Materials = lazy(() => import("./pages/admin/Materials"));
const ReviewsManager = lazy(() => import("./pages/admin/ReviewsManager"));
const Courses = lazy(() => import("./pages/admin/Courses"));
const Categories = lazy(() => import("./pages/admin/Categories"));
const Banners = lazy(() => import("./pages/admin/Banners"));
const CMSList = lazy(() => import("./pages/admin/CMSList"));
const CMSEdit = lazy(() => import("./pages/admin/CMSEdit"));
const Forms = lazy(() => import("./pages/admin/Forms"));
const Coupons = lazy(() => import("./pages/admin/Coupons"));
const ManageAdmins = lazy(() => import("./pages/admin/ManageAdmins"));
const Subscribers = lazy(() => import("./pages/admin/Subscribers"));
const Embeds = lazy(() => import("./pages/admin/Embeds"));
const TestimonialsManager = lazy(() => import("./pages/admin/TestimonialsManager"));
const CommentsManager = lazy(() => import("./pages/admin/CommentsManager"));
const Teachers = lazy(() => import("./pages/admin/Teachers"));
const PinterestManager = lazy(() => import("./pages/admin/PinterestManager"));
const PicksManager = lazy(() => import("./pages/admin/PicksManager"));
const GardenContent = lazy(() => import("./pages/admin/GardenContent"));
const GardenPostsList = lazy(() => import("./pages/admin/GardenPostsList"));
const ContentUpload = lazy(() => import("./pages/admin/ContentUpload"));
const AdminNotFound = lazy(() => import("./pages/admin/NotFound"));

// Guard Stripe initialization
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function AppWrapper() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    const unsubscribe = auth.onIdTokenChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken(true);
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <ScrollToTop />
      {!isAdmin && <Header />}
      
      {/* Suspense handles the loading state while lazy components are fetched */}
      <Suspense fallback={<div className="h-screen flex justify-center items-center"><Spinner /></div>}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/material" element={<MaterialPage />} />
          <Route path="/material-detail/:id" element={<MaterialDetail />} />
          <Route path="/school" element={<School />} />
          <Route path="/courses" element={<CoursesPage />} /> 
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/course-detail/:id" element={<CourseDetail />} />
          <Route path="/product-detail/:id" element={<ProductDetail />} />
          <Route path="/cart-checkout" element={<CartCheckout />} />
          <Route path="/order-success" element={<OrderSuccess />} /> 
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/garden-of-ideas" element={<Garden />} />
          <Route path="/garden-of-ideas/:id" element={<PostDetail />} />
          <Route path="/page/:slug" element={<CmsPage />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<RequireAuth />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="products" element={<Products />} />
              <Route path="orders" element={<Orders />} />
              <Route path="materials" element={<Materials />} />
              <Route path="reviews" element={<ReviewsManager />} />
              <Route path="courses" element={<Courses />} />
              <Route path="categories" element={<Categories />} />
              <Route path="banners" element={<Banners />} />
              <Route path="cms" element={<CMSList />} />
              <Route path="cms/new" element={<CMSEdit />} />
              <Route path="cms/edit/:id" element={<CMSEdit />} />
              <Route path="forms" element={<Forms />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="manage-admins" element={<ManageAdmins />} />
              <Route path="subscribers" element={<Subscribers />} />
              <Route path="embeds" element={<Embeds />} />
              <Route path="testimonials" element={<TestimonialsManager />} />
              <Route path="comments" element={<CommentsManager />} />
              <Route path="teachers" element={<Teachers />} />
              <Route path="pinterest" element={<PinterestManager />} />
              <Route path="picks" element={<PicksManager />} />
              <Route path="*" element={<AdminNotFound />} />
              <Route path="garden-suggestions" element={<GardenContent />} />
              <Route path="garden-posts" element={<GardenPostsList />} />  
              <Route path="garden-upload" element={<ContentUpload />} />    
              <Route path="garden-edit/:id" element={<ContentUpload />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>

      {!isAdmin && <Newsletter />}
      {!isAdmin && <Footer />}
    </>
  );
}

function App() {
  return (
    <div className="content-protected">
      {stripePromise ? (
        <Elements stripe={stripePromise}>
          <Router>
            <DisableContextMenu />
            <AppWrapper />
          </Router>
        </Elements>
      ) : (
        <Router>
          <DisableContextMenu />
          <AppWrapper />
        </Router>
      )}
    </div>
  );
}

export default App;