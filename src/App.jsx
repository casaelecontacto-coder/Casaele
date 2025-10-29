import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import AdminLayout from "./components/Admin/AdminLayout";
import React, { useEffect } from 'react';
import { auth } from './firebase';
import RequireAuth from "./components/Admin/RequireAuth";
import AdminLogin from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import UsersPage from "./pages/admin/Users";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import Materials from "./pages/admin/Materials";
import Courses from "./pages/admin/Courses";
import Categories from "./pages/admin/Categories";
import Banners from "./pages/admin/Banners";
import CMSList from "./pages/admin/CMSList";
import CMSEdit from "./pages/admin/CMSEdit";
import Forms from "./pages/admin/Forms";
import Coupons from "./pages/admin/Coupons";
import ManageAdmins from "./pages/admin/ManageAdmins";
import Subscribers from "./pages/admin/Subscribers";
import Embeds from "./pages/admin/Embeds";
import TestimonialsManager from "./pages/admin/TestimonialsManager";
import CommentsManager from "./pages/admin/CommentsManager";
import Teachers from "./pages/admin/Teachers";
import PinterestManager from "./pages/admin/PinterestManager";
import PicksManager from "./pages/admin/PicksManager";
import AdminNotFound from "./pages/admin/NotFound";
import Header from "./components/CommonPage/Header";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import School from "./pages/School";
import MaterialPage from "./pages/MaterialPage";
import MaterialDetail from "./pages/MaterialDetail";
import Newsletter from "./components/CommonPage/Newsletter";
import Footer from "./components/CommonPage/Footer";
import CourseDetail from "./pages/CourseDetail";
import CartCheckout from "./pages/CartCheckout";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import CmsPage from "./pages/CmsPage";
import ScrollToTop from "./pages/ScrollToTop";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import DisableContextMenu from "./components/Common/DisableContextMenu";
import ReviewsManager from './pages/admin/ReviewsManager';
import CoursesPage from './pages/CoursesPage'; 
import ProductsPage from './pages/ProductsPage'; 
import ProductDetail from './pages/ProductDetail';
import OrderSuccess from './pages/OrderSuccess'; // Import the new page
import Garden from "./pages/GardenOfIdeas";
import GardenPostsList from "./pages/admin/GardenPostsList";
import ContentUpload from "./pages/admin/ContentUpload";
import GardenContent from "./pages/admin/GardenContent";
import PostDetail from "./pages/PostDetail";
// Guard Stripe initialization: require Vite-prefixed key and avoid crashing if missing
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
      <Routes>
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


        {/* Admin routes */}
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

      {/* The Translate component has been removed from here */}

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