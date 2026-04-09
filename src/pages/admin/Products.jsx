// pages/admin/Products.jsx

import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiImage, FiSave, FiX, FiRefreshCw, FiDollarSign, FiBookOpen, FiFile, FiDownload } from 'react-icons/fi';
import { apiGet, apiSend } from '../../utils/api';
import Spinner from '../../components/Common/Spinner'; 

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // --- STATE MODIFIED ---
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    imageUrls: [], // Changed from imageUrl: ''
    price: 0,
    discountPrice: 0,
    availableLevels: [],
    productType: 'Digital',
    digitalFiles: [],
    downloadSettings: {
      maxDownloads: 3,
      linkExpiryDays: 30
    }
  });
  // --- END ---

  // Multi-currency pricing state
  const [pricesUSD, setPricesUSD] = useState({ price: 0, discountPrice: 0 });
  const [pricesEUR, setPricesEUR] = useState({ price: 0, discountPrice: 0 });
  const [pricesINR, setPricesINR] = useState({ price: 0, discountPrice: 0 });

  const [uploading, setUploading] = useState(false);
  const [uploadingDigitalFiles, setUploadingDigitalFiles] = useState(false); 

  const ALL_POSSIBLE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

  // --- Fetching ---
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }), 
        ...(categoryFilter && { category: categoryFilter })
      });
      const data = await apiGet(`/api/products?${params}`); 
      setProducts(data.products || []); 
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
    fetchCategories(); 
  }, [currentPage, searchTerm, categoryFilter]);

  // --- MODIFIED handleFileChange ---
  // This function now handles multiple files
  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    (`☁️ [DEBUG] Starting upload for ${files.length} files...`);
    
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = 'casadeele_materials'; // Your preset
    const uploadedUrls = [];

    try {
      // Loop over all selected files
      for (const file of files) {
        const cloudFormData = new FormData();
        cloudFormData.append('file', file);
        cloudFormData.append('upload_preset', uploadPreset); 

        (`☁️ [DEBUG] Posting ${file.name} to Cloudinary...`);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: cloudFormData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('☁️ [DEBUG] Cloudinary Error Response:', errorData);
          throw new Error(errorData.error.message || `Upload failed for ${file.name}`);
        }

        const data = await response.json();
        ('☁️ [DEBUG] Cloudinary Success Response:', data);
        uploadedUrls.push(data.secure_url);
      }

      // Add all new URLs to the existing state
      setFormData(prev => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ...uploadedUrls]
      }));
      
    } catch (error) {
      console.error('☁️ [DEBUG] Full upload error:', error);
      alert(`File upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };
  // --- END OF MODIFICATION ---

  // --- NEW: Digital File Upload Handler ---
  const handleDigitalFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingDigitalFiles(true);
    console.log(`📁 [DEBUG] Starting digital file upload for ${files.length} file(s)...`);

    const uploadedFiles = [];
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    try {
      for (const file of files) {
        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/html',
          'audio/mpeg',
          'audio/wav',
          'video/mp4',
          'application/zip'
        ];

        if (!allowedTypes.includes(file.type)) {
          alert(`File type not supported: ${file.name}. Allowed: PDF, DOC, DOCX, HTML, MP3, WAV, MP4, ZIP`);
          continue;
        }

        // Validate file size (max 100MB)
        const maxSize = 100 * 1024 * 1024; // 100MB in bytes
        if (file.size > maxSize) {
          alert(`File too large: ${file.name}. Maximum size: 100MB`);
          continue;
        }

        console.log(`📁 [DEBUG] Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)...`);

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${apiBaseUrl}/api/uploads/digital-product-file`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('📁 [DEBUG] Upload Error:', errorData);
          throw new Error(errorData.message || `Upload failed for ${file.name}`);
        }

        const data = await response.json();
        console.log('📁 [DEBUG] Upload Success:', data);

        uploadedFiles.push({
          fileUrl: data.url,
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
          cloudinaryPublicId: data.publicId
        });
      }

      // Add uploaded files to formData
      setFormData(prev => ({
        ...prev,
        digitalFiles: [...prev.digitalFiles, ...uploadedFiles]
      }));

      console.log(`📁 [DEBUG] Successfully uploaded ${uploadedFiles.length} file(s)`);

    } catch (error) {
      console.error('📁 [DEBUG] Digital file upload error:', error);
      alert(`File upload failed: ${error.message}`);
    } finally {
      setUploadingDigitalFiles(false);
      // Reset file input
      e.target.value = '';
    }
  };
  // --- END NEW ---

  // --- Checkbox Handler (No change) ---
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

  // --- MODIFIED handleSubmit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Check for imageUrls array
      if (formData.imageUrls.length === 0) {
        alert('Please upload at least one image for the product.');
        setIsSaving(false);
        return;
      }
       if (formData.availableLevels.length === 0) {
        alert('Please select at least one available level.');
        setIsSaving(false);
        return;
      }

      const payload = {
        ...formData,
        imageUrls: formData.imageUrls || [], // Ensure array is sent
        availableLevels: formData.availableLevels || [],
        prices: {
          USD: pricesUSD,
          EUR: pricesEUR,
          INR: pricesINR
        }
      };

      // Remove legacy field if it exists, just in case
      delete payload.imageUrl;

      const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const savedProduct = await apiSend(url, method, payload);

      if (editingProduct) {
        setProducts(prev => prev.map(p => (p._id === savedProduct._id ? savedProduct : p)));
      } else {
        setProducts(prev => [savedProduct, ...prev.slice(0, 9)]);
        if (products.length >= 10) fetchProducts();
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
  // --- END OF MODIFICATION ---

  // --- MODIFIED handleEdit ---
  const handleEdit = (product) => {
    setEditingProduct(product);

    // Handle backward compatibility for old products with single `imageUrl`
    let images = [];
    if (product.imageUrls && Array.isArray(product.imageUrls)) {
      images = product.imageUrls;
    } else if (product.imageUrl) {
      images = [product.imageUrl]; // Convert old string to array
    }

    setFormData({
      name: product.name || '',
      slug: product.slug || '',
      description: product.description || '',
      category: product.category || '',
      imageUrls: images, // Use the new array
      price: product.price || 0,
      discountPrice: product.discountPrice || 0,
      availableLevels: product.availableLevels || [],
      productType: product.productType || 'Digital',
      digitalFiles: product.digitalFiles || [],
      downloadSettings: product.downloadSettings || { maxDownloads: 3, linkExpiryDays: 30 }
    });

    // Populate multi-currency prices
    setPricesUSD(product.prices?.USD || { price: 0, discountPrice: 0 });
    setPricesEUR(product.prices?.EUR || { price: 0, discountPrice: 0 });
    setPricesINR(product.prices?.INR || { price: 0, discountPrice: 0 });

    setShowModal(true);
  };
  // --- END OF MODIFICATION ---

  // --- Delete Handler (No change) ---
  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await apiSend(`/api/products/${productId}`, 'DELETE'); 
        setProducts(prev => prev.filter(p => p._id !== productId));
        setSuccessMsg('Product deleted successfully');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product.');
      }
    }
  };


  // --- JSX (with modifications) ---
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
                 // MODIFIED: Reset form
                 setFormData({
                   name: '', description: '', category: '', imageUrls: [],
                   price: 0, discountPrice: 0, availableLevels: [], productType: 'Digital',
                   digitalFiles: [], downloadSettings: { maxDownloads: 3, linkExpiryDays: 30 }
                 });
                 // Reset multi-currency prices
                 setPricesUSD({ price: 0, discountPrice: 0 });
                 setPricesEUR({ price: 0, discountPrice: 0 });
                 setPricesINR({ price: 0, discountPrice: 0 });
                 setShowModal(true);
               }}
               className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
             >
               <FiPlus className="w-5 h-5" /> Add Product
             </button>
           </div>
        </div>

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
                 {/* MODIFIED: Show first image or placeholder */}
                 {product.imageUrls && product.imageUrls.length > 0 ? (
                  <div className="h-48 bg-gray-200">
                    <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover"/>
                  </div>
                 ) : product.imageUrl ? ( // Fallback for old data
                  <div className="h-48 bg-gray-200">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover"/>
                  </div>
                 ) : (
                  <div className="h-48 bg-gray-200 flex items-center justify-center"><FiImage className="w-12 h-12 text-gray-400" /></div>
                 )}
                <div className="p-6">
                   <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">{product.name}</h3>
                   <p className="text-gray-600 text-sm mb-4 line-clamp-3">{product.description}</p>
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

         {!loading && totalPages > 1 && (
           <div className="mt-8 flex justify-center">
             {/* Pagination UI similar to Courses.jsx */}
           </div>
         )}

        {/* Product Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" required /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-red-500 focus:border-red-500" required><option value="">Select Category</option>{categories.map(category => (<option key={category._id} value={category.name}>{category.name}</option>))}</select></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                  <input type="text" value={formData.slug || ''} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder={formData.name ? formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'auto-generated-from-name'} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 font-mono text-sm" />
                  <p className="mt-1 text-xs text-gray-500">Leave blank to auto-generate from name. Used in page URL for SEO.</p>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Description *</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" required /></div>
                
                 {/* --- MODIFIED IMAGE UPLOAD SECTION --- */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Images *</label>
                    <div className="mt-1 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                       <input 
                         type="file" 
                         accept="image/*" 
                         onChange={handleFileChange} 
                         className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                         multiple // Allow multiple files
                       />
                       {uploading && <div className="text-sm text-gray-500 mt-2">Uploading...</div>}
                       
                       {/* Gallery Preview */}
                       {!uploading && formData.imageUrls.length > 0 && (
                         <div className="mt-4 flex flex-wrap gap-4">
                            {formData.imageUrls.map((url, index) => (
                              <div key={index} className="relative w-32 h-32">
                                <img src={url} alt={`preview ${index + 1}`} className="h-full w-full object-cover rounded-md border" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
                                    }));
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs shadow"
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                 </div>
                 {/* --- END OF MODIFICATION --- */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label><input type="number" min="0" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" required/></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Discount Price (₹, optional)</label><input type="number" min="0" step="0.01" value={formData.discountPrice} onChange={(e) => setFormData({ ...formData, discountPrice: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" /></div>
                </div>

                {/* Multi-Currency Pricing */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-semibold mb-3">Multi-Currency Pricing</h4>

                  {/* USD */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">USD Prices</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Price (USD)"
                        value={pricesUSD.price}
                        onChange={(e) => setPricesUSD({...pricesUSD, price: parseFloat(e.target.value) || 0})}
                        className="border rounded px-3 py-2"
                      />
                      <input
                        type="number"
                        placeholder="Discount Price (USD)"
                        value={pricesUSD.discountPrice}
                        onChange={(e) => setPricesUSD({...pricesUSD, discountPrice: parseFloat(e.target.value) || 0})}
                        className="border rounded px-3 py-2"
                      />
                    </div>
                  </div>

                  {/* EUR */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">EUR Prices</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Price (EUR)"
                        value={pricesEUR.price}
                        onChange={(e) => setPricesEUR({...pricesEUR, price: parseFloat(e.target.value) || 0})}
                        className="border rounded px-3 py-2"
                      />
                      <input
                        type="number"
                        placeholder="Discount Price (EUR)"
                        value={pricesEUR.discountPrice}
                        onChange={(e) => setPricesEUR({...pricesEUR, discountPrice: parseFloat(e.target.value) || 0})}
                        className="border rounded px-3 py-2"
                      />
                    </div>
                  </div>

                  {/* INR */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">INR Prices</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Price (INR)"
                        value={pricesINR.price}
                        onChange={(e) => setPricesINR({...pricesINR, price: parseFloat(e.target.value) || 0})}
                        className="border rounded px-3 py-2"
                      />
                      <input
                        type="number"
                        placeholder="Discount Price (INR)"
                        value={pricesINR.discountPrice}
                        onChange={(e) => setPricesINR({...pricesINR, discountPrice: parseFloat(e.target.value) || 0})}
                        className="border rounded px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
                
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
                    {formData.availableLevels.length === 0 && <p className="text-xs text-red-600 mt-1">Please select at least one level.</p>}
                </div>

                <div><label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label><select value={formData.productType} onChange={(e) => setFormData({ ...formData, productType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-red-500 focus:border-red-500"><option value="Digital">Digital</option><option value="Physical">Physical</option><option value="Both">Both</option></select></div>

                {/* --- NEW: Digital Files Upload Section --- */}
                {(formData.productType === 'Digital' || formData.productType === 'Both') && (
                  <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
                    <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FiFile className="w-5 h-5 text-red-600" />
                      Digital Product Files
                    </h4>

                    {/* File Upload Input */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Files (PDF, DOC, DOCX, HTML, MP3, WAV, MP4, ZIP)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.html,.mp3,.wav,.mp4,.zip"
                        onChange={handleDigitalFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        multiple
                        disabled={uploadingDigitalFiles}
                      />
                      {uploadingDigitalFiles && (
                        <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
                          <FiRefreshCw className="animate-spin" />
                          Uploading files...
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Max file size: 100MB per file</p>
                    </div>

                    {/* Uploaded Files List */}
                    {formData.digitalFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Uploaded Files ({formData.digitalFiles.length})
                        </p>
                        {formData.digitalFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-red-300 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FiFile className="w-5 h-5 text-red-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {file.fileName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {file.fileType.toUpperCase()} • {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  digitalFiles: prev.digitalFiles.filter((_, i) => i !== index)
                                }));
                              }}
                              className="ml-2 text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50 flex-shrink-0"
                              title="Remove file"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Download Settings */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Downloads per Customer
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={formData.downloadSettings.maxDownloads}
                          onChange={(e) => setFormData({
                            ...formData,
                            downloadSettings: {
                              ...formData.downloadSettings,
                              maxDownloads: parseInt(e.target.value) || 3
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Default: 3 downloads</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Link Expiry (Days)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={formData.downloadSettings.linkExpiryDays}
                          onChange={(e) => setFormData({
                            ...formData,
                            downloadSettings: {
                              ...formData.downloadSettings,
                              linkExpiryDays: parseInt(e.target.value) || 30
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Default: 30 days</p>
                      </div>
                    </div>
                  </div>
                )}
                {/* --- END NEW --- */}

                <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={isSaving || uploading || uploadingDigitalFiles} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-60">
                    <FiSave className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                    {isSaving ? 'Saving…' : (uploading || uploadingDigitalFiles ? 'Uploading...' : (editingProduct ? 'Update Product' : 'Create Product'))}
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