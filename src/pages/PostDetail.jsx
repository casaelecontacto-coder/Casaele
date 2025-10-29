import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet } from '../utils/api';
import { FiHome } from 'react-icons/fi';

function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const data = await apiGet(`/api/posts/${id}`);
        setPost(data);
      } catch (error) {
        console.error("Failed to fetch post:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) {
    return <div className="text-center p-20 font-semibold">Loading Post...</div>;
  }

  if (!post) {
    return <div className="text-center p-20">Post not found.</div>;
  }

  return (
    <div className="bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-gray-700 flex items-center gap-1">
            <FiHome className="w-4 h-4" /> Home
          </Link>
          <span className="mx-2">/</span>
          <Link to="/garden-of-ideas" className="hover:text-gray-700">Garden of Ideas</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700 font-medium truncate">{post.title}</span>
        </nav>

        {/* Post Header */}
        <div className="w-full mb-12">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-auto rounded-2xl object-cover aspect-video shadow-lg"
          />
        </div>

        {/* Post Content */}
        <div className="bg-white rounded-xl p-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Posted on: {new Date(post.createdAt).toLocaleDateString()}
          </p>
          <div className="prose lg:prose-lg max-w-none text-gray-700 whitespace-pre-wrap">
            {post.description}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostDetail;