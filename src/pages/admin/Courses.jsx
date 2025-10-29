import React, { useState, useEffect } from 'react';
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiEye, // Keep if used for preview or similar
  FiRefreshCw,
  FiBookOpen,
  FiClock, // Keep if modules are still relevant
  FiUsers, // Keep if instructor is relevant
  FiDollarSign,
  FiImage,
  FiSave,
  FiX
} from 'react-icons/fi';
import { apiGet, apiSend } from '../../utils/api';
import Spinner from '../../components/Common/Spinner'; // Assuming Spinner path

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // *** ADDED availableLevels to default state ***
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    images: [],
    imageSource: '', // Keep if needed
    price: 0,
    discountPrice: 0, // Added discount price
    level: '', // Keep if you still have a main level concept
    availableLevels: [], // Initialize as empty array
    language: 'Spanish', // Keep if relevant
    instructor: 'CasaDeELE Team',
    modules: [], // Keep if relevant
    productType: 'Digital' // Keep productType
  });
  
  // Image handling state (keep if needed)
  const [imgMode, setImgMode] = useState('local');
  const [pinUrl, setPinUrl] = useState('');
  const [pinPreview, setPinPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // *** Define possible levels for checkboxes ***
  const ALL_POSSIBLE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

  // Fetching functions (keep as they are, assuming they work)
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10, // Adjust limit if needed
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter })
      });

      const data = await apiGet(`/api/courses?${params}`);
      setCourses(data.courses || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]); // Set empty array on error
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
      setCategories([]); // Set empty array on error
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, [currentPage, searchTerm, categoryFilter]);

  // Image upload handler (keep if needed)
  const handleFileChange = async (e) => {
    // ... (keep existing image upload logic)
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    const uploadedImageUrls = [];
    try {
      for (const file of files) {
        const { timestamp, signature } = await apiGet('/api/cloudinary-signature');
        const cloudFormData = new FormData();
        cloudFormData.append('file', file);
        cloudFormData.append('api_key', import.meta.env.VITE_CLOUDINARY_API_KEY);
        cloudFormData.append('timestamp', timestamp);
        cloudFormData.append('signature', signature);
        cloudFormData.append('upload_preset', 'casadeele_materials'); // Use appropriate preset

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: 'POST',
          body: cloudFormData,
        });
        if (!response.ok) throw new Error('Cloudinary upload failed');
        const data = await response.json();
        uploadedImageUrls.push(data.secure_url);
      }
      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedImageUrls], imageSource: 'local' }));
    } catch (error) {
      alert(`File upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // *** Checkbox handler ***
  const handleLevelCheckboxChange = (level) => {
    setFormData(prevForm => {
        const currentLevels = prevForm.availableLevels || [];
        if (currentLevels.includes(level)) {
            // Remove level
            return { ...prevForm, availableLevels: currentLevels.filter(l => l !== level) };
        } else {
            // Add level
            return { ...prevForm, availableLevels: [...currentLevels, level] };
        }
    });
  };

  // Submit handler (Add availableLevels)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (formData.images.length === 0 && !formData.thumbnail) { // Check if at least one image exists
        alert('Please upload at least one image or provide a thumbnail URL.');
        setIsSaving(false);
        return;
      }
      
      // *** ADD availableLevels to payload ***
      const payload = {
        ...formData,
        // Ensure modules are correctly formatted if still used
        modules: formData.modules.map((m, index) => ({ ...m, order: m.order || index + 1 })),
        availableLevels: formData.availableLevels || [] // Ensure it's an array
      };

      const url = editingCourse ? `/api/courses/${editingCourse._id}` : '/api/courses';
      const method = editingCourse ? 'PUT' : 'POST';
      const savedCourse = await apiSend(url, method, payload);

      if (editingCourse) {
        setCourses(prev => prev.map(c => (c._id === savedCourse._id ? savedCourse : c)));
      } else {
        // Add new course to the beginning and handle pagination potentially
        setCourses(prev => [savedCourse, ...prev.slice(0, 9)]); // Example: keep 10 items
        if (courses.length >= 10) fetchCourses(); // Refresh if page might have overflowed
      }
      setShowModal(false);
      setSuccessMsg(editingCourse ? 'Course updated!' : 'Course created!');
      setTimeout(() => setSuccessMsg(''), 3000);

    } catch (error) {
      console.error("Failed to save course:", error);
      alert('Failed to save course. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  };


  // Edit handler (Load availableLevels)
  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || '',
      description: course.description || '',
      category: course.category || '',
      images: course.images || [], // Default to empty array
      thumbnail: course.thumbnail || '', // Load thumbnail if exists
      price: course.price || 0,
      discountPrice: course.discountPrice || 0, // Load discount price
      level: course.level || '', // Load main level
      availableLevels: course.availableLevels || [], // *** LOAD availableLevels ***
      language: course.language || 'Spanish',
      instructor: course.instructor || 'CasaDeELE Team',
      modules: course.modules || [],
      productType: course.productType || 'Digital' // Load productType
    });
    // Determine image mode based on loaded data if needed
    // setImgMode(course.imageSource === 'pinterest' ? 'pinterest' : 'local');
    setShowModal(true);
  };

  // Delete handler (no changes needed)
  const handleDelete = async (courseId) => {
    // ... (keep existing delete logic)
     if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await apiSend(`/api/courses/${courseId}`, 'DELETE');
        setCourses(prev => prev.filter(c => c._id !== courseId));
        setSuccessMsg('Course deleted successfully');
        setTimeout(() => setSuccessMsg(''), 3000);
        // Consider adjusting current page if the last item on it was deleted
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Failed to delete course.');
      }
    }
  };

  // Module handlers (keep if needed)
  const addModule = () => {
    setFormData({
      ...formData,
      modules: [...formData.modules, { title: '', description: '', duration: '', order: formData.modules.length + 1 }]
    });
  };

  const updateModule = (index, field, value) => {
    const updatedModules = [...formData.modules];
    updatedModules[index] = { ...updatedModules[index], [field]: value }; // Safer update
    setFormData({ ...formData, modules: updatedModules });
  };

  const removeModule = (index) => {
    const updatedModules = formData.modules.filter((_, i) => i !== index);
    // Optionally re-order remaining modules
    const reorderedModules = updatedModules.map((m, idx) => ({ ...m, order: idx + 1 }));
    setFormData({ ...formData, modules: reorderedModules });
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Courses Management</h1>
              <p className="text-gray-600">Create and manage your learning courses</p>
            </div>
            <button
              onClick={() => {
                setEditingCourse(null);
                // *** Reset availableLevels ***
                setFormData({
                  title: '', description: '', category: '', images: [],
                  thumbnail: '', price: 0, discountPrice: 0, level: '', availableLevels: [], 
                  language: 'Spanish', instructor: 'CasaDeELE Team', modules: [], productType: 'Digital'
                });
                setShowModal(true);
              }}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" /> Add Course
            </button>
          </div>
        </div>

        {/* Stats Cards (keep if relevant) */}
        {/* ... */}

        {/* Filters and Search (keep) */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
           {/* ... Filter inputs ... */}
         </div>

        {/* Courses Grid (keep) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             <div className="col-span-full flex items-center justify-center py-12">
               <Spinner /> Loading courses...
             </div>
          ) : courses.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FiBookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-500">Get started by creating your first course.</p>
            </div>
          ) : (
            courses.map((course) => (
              <div key={course._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Course Card Content (Use first image or thumbnail) */}
                 {(course.images && course.images.length > 0) || course.thumbnail ? (
                  <div className="h-48 bg-gray-200">
                    <img
                      src={course.images?.[0] || course.thumbnail} // Prioritize images array
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    <FiImage className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="p-6">
                   {/* ... Card details ... */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{course.title}</h3>
                      {/* Display 'main' level if needed */}
                      {course.level && <span className={`px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800`}>{course.level}</span>}
                    </div>
                     <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.description}</p>
                    {/* Display available levels */}
                    {course.availableLevels && course.availableLevels.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-1">
                            {course.availableLevels.map(lvl => (
                                <span key={lvl} className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">{lvl}</span>
                            ))}
                        </div>
                    )}
                     <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                       <span className="flex items-center gap-1"><FiBookOpen className="w-4 h-4" />{course.category}</span>
                       <span className="flex items-center gap-1"><FiDollarSign className="w-4 h-4" />₹{course.discountPrice || course.price || 0}</span>
                     </div>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <button onClick={() => handleEdit(course)} className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"><FiEdit className="w-4 h-4" /></button>
                         <button onClick={() => handleDelete(course._id)} className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50"><FiTrash2 className="w-4 h-4" /></button>
                      </div>
                     <span className="text-xs text-gray-500">{new Date(course.createdAt).toLocaleDateString()}</span>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination (keep) */}
        {/* ... */}

        {/* Course Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                 <h3 className="text-lg font-semibold text-gray-900">{editingCourse ? 'Edit Course' : 'Add New Course'}</h3>
                 <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX className="w-6 h-6" /></button>
              </div>
              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                {/* --- ALL FORM FIELDS --- */}
                {/* Title, Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" required /></div>
                   <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-red-500 focus:border-red-500" required><option value="">Select Category</option>{categories.map(category => (<option key={category._id} value={category.name}>{category.name}</option>))}</select></div>
                </div>
                {/* Description */}
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Description *</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" required /></div>
                
                {/* Image Uploader */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
                    <div className="mt-1 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                       <input type="file" multiple onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"/>
                       {uploading && <div className="text-sm text-gray-500 mt-2">Uploading...</div>}
                       {/* Image Previews */}
                       <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                          {formData.images.map((image, index) => (
                            <div key={index} className="relative aspect-square">
                              <img src={image} alt={`preview ${index}`} className="h-full w-full object-cover rounded-md border" />
                              <button type="button" onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs shadow">&times;</button>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Thumbnail URL (Optional Fallback) */}
                 <div><label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL (Optional)</label><input type="url" placeholder="https://..." value={formData.thumbnail} onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" /></div>

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
                    {/* Add validation message if needed */}
                    {/* {formData.availableLevels.length === 0 && <p className="text-xs text-red-600 mt-1">Please select at least one level.</p>} */}
                </div>
                {/* --- END AVAILABLE LEVELS --- */}

                {/* Product Type, Instructor, Language */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div><label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label><select value={formData.productType} onChange={(e) => setFormData({ ...formData, productType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-red-500 focus:border-red-500"><option value="Digital">Digital</option><option value="Physical">Physical</option><option value="Both">Both</option></select></div>
                     <div><label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label><input type="text" value={formData.instructor} onChange={(e) => setFormData({ ...formData, instructor: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" /></div>
                     <div><label className="block text-sm font-medium text-gray-700 mb-1">Language</label><input type="text" value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" /></div>
                 </div>
                 
                 {/* Main Level (Optional) */}
                 {/* <div><label className="block text-sm font-medium text-gray-700 mb-1">Main Level (Optional)</label><input type="text" value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Intermediate or B1"/></div> */}


                {/* Modules (keep if needed) */}
                {/* ... (Module add/edit/remove UI) ... */}

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={isSaving || uploading} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-60">
                    <FiSave className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} /> 
                    {isSaving ? 'Saving…' : (uploading ? 'Uploading...' : (editingCourse ? 'Update Course' : 'Create Course'))}
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

export default Courses;