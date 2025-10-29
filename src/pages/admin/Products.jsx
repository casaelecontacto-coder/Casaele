import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiImage, FiSave, FiX, FiRefreshCw, FiDollarSign, FiBookOpen } from 'react-icons/fi'; // Added icons
import { apiGet, apiSend } from '../../utils/api';
import Spinner from '../../components/Common/Spinner'; // Assuming Spinner path

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // Products might use categories
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // *** ADDED availableLevels to default state ***
  const [formData, setFormData] = useState({
    name: '', // Products use 'name'
    description: '',
    category: '',
    imageUrl: '', // Single image URL for product
    price: 0,
    discountPrice: 0,
    availableLevels: [], // Initialize as empty array
    productType: 'Digital',
  });
  
  const [uploading, setUploading] = useState(false); // For single image upload

   // *** Define possible levels for checkboxes ***
  const ALL_POSSIBLE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

  // --- Fetching ---
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }), // Assuming API supports search on 'name'
        ...(categoryFilter && { category: categoryFilter })
      });
      // Use the products endpoint
      const data = await apiGet(`/api/products?${params}`); 
      setProducts(data.products || []); // Adjust based on API response
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await apiGet('/api/categories');
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories(); // Fetch categories if products use them
  }, [currentPage, searchTerm, categoryFilter]);

  // --- Image Upload (Simplified for single image) ---
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { timestamp, signature } = await apiGet('/api/cloudinary-signature');
      const cloudFormData = new FormData();
      cloudFormData.append('file', file);
      cloudFormData.append('api_key', import.meta.env.VITE_CLOUDINARY_API_KEY);
      cloudFormData.append('timestamp', timestamp);
      cloudFormData.append('signature', signature);
      cloudFormData.append('upload_preset', 'casadeele_materials'); // Use appropriate preset

      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { // Use image endpoint
        method: 'POST',
        body: cloudFormData,
      });
      if (!response.ok) throw new Error('Cloudinary upload failed');
      const data = await response.json();
      setFormData(prev => ({ ...prev, imageUrl: data.secure_url })); // Set single imageUrl
    } catch (error) {
      alert(`File upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // --- Checkbox Handler ---
  const handleLevelCheckboxChange = (level) => {
    setFormData(prevForm => {
        const currentLevels = prevForm.availableLevels || [];
        if (currentLevels.includes(level)) {
            return { ...prevForm, availableLevels: currentLevels.filter(l => l !== level) };
        } else {
            return { ...prevForm, availableLevels: [...currentLevels, level] };
        }
    });
  };

  // --- Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Basic validation
      if (!formData.imageUrl) { 
        alert('Please upload an image for the product.');
        setIsSaving(false);
        return;
      }
       if (formData.availableLevels.length === 0) { // Require at least one level
        alert('Please select at least one available level.');
        setIsSaving(false);
        return;
      }

      // *** ADD availableLevels to payload ***
      const payload = {
        ...formData,
        availableLevels: formData.availableLevels || [] // Ensure array
      };
      
      // Use products endpoint
      const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products'; 
      const method = editingProduct ? 'PUT' : 'POST';
      const savedProduct = await apiSend(url, method, payload);

      if (editingProduct) {
        setProducts(prev => prev.map(p => (p._id === savedProduct._id ? savedProduct : p)));
      } else {
        setProducts(prev => [savedProduct, ...prev.slice(0, 9)]);
        if (products.length >= 10) fetchProducts(); // Refresh if page might overflow
      }
      setShowModal(false);
      setSuccessMsg(editingProduct ? 'Product updated!' : 'Product created!');
      setTimeout(() => setSuccessMsg(''), 3000);

    } catch (error) {
      console.error("Failed to save product:", error);
      alert('Failed to save product. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Edit Handler ---
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '', // Use 'name'
      description: product.description || '',
      category: product.category || '',
      imageUrl: product.imageUrl || '', // Use 'imageUrl'
      price: product.price || 0,
      discountPrice: product.discountPrice || 0,
      availableLevels: product.availableLevels || [], // *** LOAD availableLevels ***
      productType: product.productType || 'Digital',
    });
    setShowModal(true);
  };

  // --- Delete Handler ---
  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await apiSend(`/api/products/${productId}`, 'DELETE'); // Use products endpoint
        setProducts(prev => prev.filter(p => p._id !== productId));
        setSuccessMsg('Product deleted successfully');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product.');
      }
    }
  };


  // --- JSX ---
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {successMsg && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
            {successMsg}
          </div>
        )}
        {/* Header */}
        <div className="mb-8">
           <div className="flex items-center justify-between">
             <div>
               <h1 className="text-3xl font-bold text-gray-900 mb-2">Products Management</h1>
               <p className="text-gray-600">Create and manage your shop products</p>
             </div>
             <button
               onClick={() => {
                 setEditingProduct(null);
                 // *** Reset availableLevels ***
                 setFormData({
                   name: '', description: '', category: '', imageUrl: '', 
                   price: 0, discountPrice: 0, availableLevels: [], productType: 'Digital'
                 });
                 setShowModal(true);
               }}
               className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
             >
               <FiPlus className="w-5 h-5" /> Add Product
             </button>
           </div>
        </div>

        {/* Filters and Search (Optional for products) */}
         {/* You can add filters similar to Courses.jsx if needed */}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             <div className="col-span-full flex items-center justify-center py-12"><Spinner /> Loading products...</div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FiImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500">Get started by creating your first product.</p>
            </div>
          ) : (
            products.map((product) => (
              <div key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Product Card Content */}
                 {product.imageUrl ? (
                  <div className="h-48 bg-gray-200">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover"/>
                  </div>
                ) : (
                  <div className="h-48 bg-gray-200 flex items-center justify-center"><FiImage className="w-12 h-12 text-gray-400" /></div>
                )}
                <div className="p-6">
                   <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">{product.name}</h3>
                   <p className="text-gray-600 text-sm mb-4 line-clamp-3">{product.description}</p>
                   {/* Display available levels */}
                   {product.availableLevels && product.availableLevels.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-1">
                            {product.availableLevels.map(lvl => (
                                <span key={lvl} className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">{lvl}</span>
                            ))}
                        </div>
                    )}
                   <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                     {product.category && <span className="flex items-center gap-1"><FiBookOpen className="w-4 h-4" />{product.category}</span>}
                     <span className="flex items-center gap-1"><FiDollarSign className="w-4 h-4" />₹{product.discountPrice || product.price || 0}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"><FiEdit className="w-4 h-4" /></button>
                       <button onClick={() => handleDelete(product._id)} className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50"><FiTrash2 className="w-4 h-4" /></button>
                     </div>
                     <span className="text-xs text-gray-500">{new Date(product.createdAt).toLocaleDateString()}</span>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {/* Add Pagination component usage here if needed */}
         {!loading && totalPages > 1 && (
           <div className="mt-8 flex justify-center">
             {/* Pagination UI similar to Courses.jsx */}
           </div>
         )}

        {/* Product Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"> {/* Adjusted max-width */}
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX className="w-6 h-6" /></button>
              </div>
              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                {/* Name, Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" required /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-red-500 focus:border-red-500" required><option value="">Select Category</option>{categories.map(category => (<option key={category._id} value={category.name}>{category.name}</option>))}</select></div>
                </div>
                {/* Description */}
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Description *</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" required /></div>
                
                {/* Image Uploader (Single Image) */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image *</label>
                    <div className="mt-1 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                       <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"/>
                       {uploading && <div className="text-sm text-gray-500 mt-2">Uploading...</div>}
                       {/* Image Preview */}
                       {formData.imageUrl && !uploading && (
                         <div className="mt-4 relative w-32 h-32"> {/* Fixed size preview */}
                            <img src={formData.imageUrl} alt="preview" className="h-full w-full object-cover rounded-md border" />
                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs shadow">&times;</button>
                         </div>
                       )}
                    </div>
                 </div>

                {/* Price, Discount Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label><input type="number" min="0" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" required/></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Discount Price (₹, optional)</label><input type="number" min="0" step="0.01" value={formData.discountPrice} onChange={(e) => setFormData({ ...formData, discountPrice: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" /></div>
                </div>
                
                {/* --- AVAILABLE LEVELS CHECKBOXES --- */}
                <div className="block">
                    <span className="text-sm font-medium text-gray-700">Available Levels *</span>
                    <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {ALL_POSSIBLE_LEVELS.map(level => (
                            <label key={level} className="flex items-center gap-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer has-[:checked]:bg-red-50 has-[:checked]:border-red-300">
                                <input
                                    type="checkbox"
                                    value={level}
                                    checked={formData.availableLevels.includes(level)}
                                    onChange={() => handleLevelCheckboxChange(level)}
                                    className="rounded accent-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">{level}</span>
                            </label>
                        ))}
                    </div>
                     {/* Add validation message */}
                    {formData.availableLevels.length === 0 && <p className="text-xs text-red-600 mt-1">Please select at least one level.</p>}
                </div>
                {/* --- END AVAILABLE LEVELS --- */}

                {/* Product Type */}
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label><select value={formData.productType} onChange={(e) => setFormData({ ...formData, productType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-red-500 focus:border-red-500"><option value="Digital">Digital</option><option value="Physical">Physical</option><option value="Both">Both</option></select></div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={isSaving || uploading} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-60">
                    <FiSave className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} /> 
                    {isSaving ? 'Saving…' : (uploading ? 'Uploading...' : (editingProduct ? 'Update Product' : 'Create Product'))}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;