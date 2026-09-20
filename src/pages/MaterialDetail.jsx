import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MaterialHeader from '../components/Material/MaterialDetail/MaterialHeader';
import DropDown from '../components/Material/MaterialDetail/DropDown';
import RelatedMaterial from '../components/Material/MaterialDetail/RelatedMaterial';
import CommentList from '../components/Material/MaterialDetail/CommentList';
import CommentForm from '../components/Material/MaterialDetail/CommentForm';
import material from '../components/Material/MaterialDetail/material';
import commentsData from '../components/Material/MaterialDetail/commentsData'; //
import { apiGet } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AuthForm from './LogIn';

function MaterialDetail() {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const [showAuth, setShowAuth] = useState(false);
    const [material, setMaterial] = useState(null);
    const [comments, setComments] = useState([]);
    const [relatedMaterials, setRelatedMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMaterial = async () => {
            try {
                setLoading(true);
                // Fetch the material and its related items in parallel instead of
                // sequentially — same result, one round-trip of latency instead of two.
                const [data, relatedData] = await Promise.all([
                    apiGet(`/api/materials/${id}`),
                    apiGet(`/api/materials?limit=4&exclude=${id}`)
                ]);
                setMaterial(data);
                // Assuming comments are fetched separately or included
                setComments(data.comments || []); // Use fetched comments if available
                setRelatedMaterials(relatedData.materials || relatedData);
            } catch (err) {
                setError(err.message);
                console.error("Failed to fetch material:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMaterial();
    }, [id]);

    const handleCommentSubmit = (newComment) => {
        // API call to post comment would go here
        ('New comment submitted:', newComment);
        // Optimistically update UI (or refetch comments)
        const commentWithUser = {
            ...newComment,
            _id: Date.now().toString(), // temp ID
            user: { name: 'Current User' }, // Placeholder user
            createdAt: new Date().toISOString(),
        };
        setComments(prevComments => [commentWithUser, ...prevComments]);
    };
    
    if(loading){
        return <div className="text-center p-20">Loading material...</div>;
    }
    
    if(error){
        return <div className="text-center p-20 text-red-600">Error: {error}</div>;
    }

    if (!material) {
        return <div className="text-center p-20">Material not found.</div>;
    }

    if (!currentUser) {
        return (
            <div className="text-center py-24 px-4">
                <h2 className="text-2xl font-bold mb-3">Log in to read this chapter</h2>
                <p className="text-gray-600 mb-6">"{material.title}" is free, but you'll need an account to view it.</p>
                <button
                    onClick={() => setShowAuth(true)}
                    className="bg-casa-red text-white px-6 py-3 rounded-full font-semibold hover:bg-casa-redDark transition-colors"
                >
                    Log in / Sign up
                </button>
                {showAuth && <AuthForm onClose={() => setShowAuth(false)} />}
            </div>
        );
    }

    return (
        <div className="w-full bg-white">
            <div className=" max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <section>
                    <MaterialHeader material={material} />
                </section>
                <section className="py-12 sm:py-16">
                    <DropDown 
                        title={material.dropdownTitle || 'Ejercicios'} 
                        exercises={material.embedIds || []} 
                    />
                </section>
                <section className="py-12 sm:py-16 border-t border-gray-200">
                    <RelatedMaterial materials={relatedMaterials} />
                </section>
                <section className="py-12 sm:py-16 border-t border-gray-200">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                        <div className="lg:col-span-2">
                            {/* Pass fetched comments to CommentList */}
                            <CommentList comments={comments} /> 
                        </div>
                        <div>
                            <CommentForm onSubmit={handleCommentSubmit} />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default MaterialDetail; //