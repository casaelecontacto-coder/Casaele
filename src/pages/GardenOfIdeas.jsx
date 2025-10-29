import React, { useState, useEffect, useMemo } from "react";
import { Link } from 'react-router-dom'; // 1. Import Link
import { apiGet, apiSend } from "../utils/api";
import { FiTrash2 } from 'react-icons/fi';
import SuggestionsSection from "../components/Home/SuggestionsSection";

function Garden() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);


  const isAdmin = useMemo(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role === 'admin' || payload.email === import.meta.env.VITE_SUPER_ADMIN_EMAIL;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const data = await apiGet('/api/posts');
        setPosts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await apiSend(`/api/posts/${postId}`, 'DELETE');
        setPosts(posts.filter(p => p._id !== postId));
      } catch (error) {
        alert(`Failed to delete post: ${error.message}`);
      }
    }
  };

return (
    <div className="font-sans text-gray-800">
      <section className="flex justify-center items-center w-full bg-white py-10">
        <div className="w-full max-w-6xl text-center px-6">
          <h1 className="text-4xl font-bold text-black py-16">
            El jardín de ideas
          </h1>
          <p className="text-2xl text-center text-black mb-12">
            Explore our garden of ideas! Here you'll find creative content, updates, and inspiration for your Spanish learning journey.
          </p>


          <div className="flex h-auto flex-wrap w-full overflow-hidden justify-evenly">
            <img className="h-44 w-auto" src="src\public\GardenOfIdeas\img1_gardenofideas.png" alt="" />
            <img className="h-44 w-auto" src="src\public\GardenOfIdeas\img2_gardenofideas.png" alt="" />
            <img className="h-44 w-auto" src="src\public\GardenOfIdeas\img3_gardenofideas.png" alt="" />
            <img className="h-44 w-auto" src="src\public\GardenOfIdeas\img4_gardenofideas.png" alt="" />
            </div>
          

        </div>
      </section>
            <SuggestionsSection />

    </div>
  );
}

export default Garden;