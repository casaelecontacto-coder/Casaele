// src/pages/admin/GardenPostsList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiGet, apiSend } from '../../utils/api';
import { FiPlus, FiEdit, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import Spinner from '../../components/Common/Spinner';

export default function GardenPostsList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchPosts = () => {
    setLoading(true);
    setError('');
    apiGet('/api/posts')
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error("Failed to fetch posts:", err);
        setError('Failed to load posts.');
        setPosts([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await apiSend(`/api/posts/${postId}`, 'DELETE');
        setPosts(posts.filter(p => p._id !== postId));
        // Optionally show a success message
      } catch (err) {
        alert(`Failed to delete post: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Garden of Ideas Posts</h1>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => navigate('/admin/garden-upload')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
          >
            <FiPlus /> Add New Post
          </button>
          <button onClick={fetchPosts} disabled={loading} className="p-2 border rounded-md hover:bg-gray-50">
              <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

      <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-10"><Spinner /> Loading posts...</div>
        ) : (
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-10 text-gray-500">No posts found.</td></tr>
              ) : posts.map(post => (
                <tr key={post._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <img src={post.imageUrl} alt={post.title} className="w-16 h-12 object-cover rounded"/>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{post.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(post.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 space-x-2">
                    <Link to={`/admin/garden-edit/${post._id}`} className="px-3 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm inline-flex items-center gap-1">
                      <FiEdit className="w-3 h-3"/> Edit
                    </Link>
                    <button onClick={() => handleDelete(post._id)} className="px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 text-sm inline-flex items-center gap-1">
                      <FiTrash2 className="w-3 h-3"/> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}