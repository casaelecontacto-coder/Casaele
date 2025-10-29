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

function MaterialDetail() {
    const { id } = useParams();
    const [material, setMaterial] = useState(null);
    const [comments, setComments] = useState([]);
    const [relatedMaterials, setRelatedMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMaterial = async () => {
            try {
                setLoading(true);
                const data = await apiGet(`/api/materials/${id}`);
                setMaterial(data);
                // Assuming comments are fetched separately or included
                setComments(data.comments || []); // Use fetched comments if available
                // Fetch related materials
                const relatedData = await apiGet(`/api/materials?limit=4&exclude=${id}`);
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
        console.log('New comment submitted:', newComment);
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