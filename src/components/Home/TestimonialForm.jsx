import { useState } from "react";
import { apiSend, apiGet } from "../../utils/api";

function TestimonialForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    profession: "",
    level: "",
    message: "",
    rating: "",
    videoUrl: ""
  })
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState("")
  const [uploadingVideo, setUploadingVideo] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file size (limit to 10MB for images)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setNotice("Image file too large. Please select a file smaller than 10MB.")
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setNotice("Please select a valid image file.")
      return
    }

    setUploadingVideo(true)
    try {
      const { timestamp, signature } = await apiGet('/api/cloudinary-signature')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', import.meta.env.VITE_CLOUDINARY_API_KEY)
      formData.append('timestamp', timestamp)
      formData.append('signature', signature)
      formData.append('upload_preset', 'casadeele_materials')
      
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) throw new Error('Image upload failed')
      const data = await response.json()
      
      setFormData(prev => ({
        ...prev,
        videoUrl: data.secure_url
      }))
      setNotice("Image uploaded successfully!")
    } catch (error) {
      setNotice("Image upload failed. Please try again.")
    } finally {
      setUploadingVideo(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setNotice("")
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'country', 'profession', 'level', 'message']
    const missingFields = requiredFields.filter(field => !formData[field].trim())
    
    if (missingFields.length > 0) {
      setNotice(`Please fill in: ${missingFields.join(', ')}`)
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setNotice("Please provide a valid email address")
      return
    }

    setLoading(true)
    try {
      await apiSend('/api/testimonials/add', 'POST', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        country: formData.country.trim(),
        profession: formData.profession.trim(),
        level: formData.level.trim(),
        message: formData.message.trim(),
        rating: formData.rating ? Number(formData.rating) : undefined,
        videoUrl: formData.videoUrl || ''
      })
      
      setNotice("Thanks! Your testimonial is pending approval.")
      setFormData({
        name: "",
        email: "",
        country: "",
        profession: "",
        level: "",
        message: "",
        rating: "",
        videoUrl: ""
      })
    } catch (e) {
      setNotice(e?.message || 'Failed to submit testimonial')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 bg-gray-50">
      <h2 className="text-center font-medium text-2xl sm:text-3xl mb-10 text-gray-800">
        Write a testimonial
      </h2>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        {/* First Row - Name, Email, Country, Profession, Level */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <input 
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            type="text" 
            placeholder="Your Name *" 
            className="border border-gray-300 placeholder-gray-500 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-gray-50 hover:bg-white" 
          />
          <input 
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            type="email" 
            placeholder="Your Email *" 
            className="border border-gray-300 placeholder-gray-500 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-gray-50 hover:bg-white" 
          />
          <input 
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            type="text" 
            placeholder="Country *" 
            className="border border-gray-300 placeholder-gray-500 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-gray-50 hover:bg-white" 
          />
          <input 
            name="profession"
            value={formData.profession}
            onChange={handleInputChange}
            type="text" 
            placeholder="Profession *" 
            className="border border-gray-300 placeholder-gray-500 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-gray-50 hover:bg-white" 
          />
          <input 
            name="level"
            value={formData.level}
            onChange={handleInputChange}
            type="text" 
            placeholder="Level (A-C) *" 
            className="border border-gray-300 placeholder-gray-500 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-gray-50 hover:bg-white" 
          />
        </div>

        {/* Second Row - Comment and Upload Video */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <textarea 
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            placeholder="Comment" 
            className="border border-gray-300 placeholder-gray-500 rounded-xl px-4 py-3 w-full h-32 resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-gray-50 hover:bg-white"
          />
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 hover:bg-red-50 transition-all duration-200">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="flex flex-col items-center">
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-600 font-medium">Upload Image</span>
                <span className="text-xs text-gray-500 mt-1">JPG, PNG, GIF</span>
                {uploadingVideo && <span className="text-xs text-red-500 mt-1 font-medium">Uploading...</span>}
              </div>
            </label>
          </div>
        </div>

        {/* Third Row - Rating */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Rating (Optional)</label>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, rating: (i + 1).toString() }))}
                  className={`w-8 h-8 transition-colors ${
                    i < Number(formData.rating) 
                      ? 'text-yellow-400 hover:text-yellow-500' 
                      : 'text-gray-300 hover:text-yellow-300'
                  }`}
                >
                  <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-2">
              {formData.rating ? `${formData.rating}/5` : 'Click to rate'}
            </span>
            {formData.rating && (
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, rating: '' }))}
                className="text-xs text-gray-500 hover:text-gray-700 ml-2 underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button 
            disabled={loading} 
            className="bg-[rgba(173,21,24,1)] hover:bg-red-700 text-white px-8 py-3 rounded-full transition-all disabled:opacity-60 w-full sm:w-auto shadow-md hover:shadow-lg font-medium"
          >
            {loading ? 'Submitting...' : 'Post'}
          </button>
          {notice && (
            <div className={`mt-4 text-sm font-medium ${notice.includes('Thanks') ? 'text-green-600' : 'text-red-600'}`}>
              {notice}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

export default TestimonialForm;