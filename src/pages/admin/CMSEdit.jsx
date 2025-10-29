import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiSend } from '../../utils/api'
import { Editor } from '@tinymce/tinymce-react'

export default function CMSEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  // ++ ADD 'secondSectionEmbed' to state ++
  const [form, setForm] = useState({ title: '', slug: '', content: '', imageUrl: '', secondSectionEmbed: null })
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  // ++ ADD state for embeds list ++
  const [availableEmbeds, setAvailableEmbeds] = useState([]);

  useEffect(() => {
    // ++ Fetch embeds when the component mounts ++
    apiGet('/api/embeds')
      .then(setAvailableEmbeds)
      .catch(() => console.error("Failed to load embeds list"));

    if (!isNew && id) {
      apiGet(`/api/cms/${id}`).then(data => {
        // ++ Ensure the embed ID is loaded correctly ++
        setForm({
          title: data.title || '',
          slug: data.slug || '',
          content: data.content || '',
          imageUrl: data.imageUrl || '',
          // Store just the ID from the populated object, or null
          secondSectionEmbed: data.secondSectionEmbed?._id || null 
        });
      }).catch(() => {});
    }
  }, [id, isNew])

  // Handle image upload to Backend/Cloudinary
  const handleImageUpload = async (e) => {
    // ... (this function remains the same)
     const file = e.target.files[0]
        if (!file) return

        // Check file size (limit to 5MB)
        const maxSize = 5 * 1024 * 1024 // 5MB in bytes
        if (file.size > maxSize) {
          alert(`File size too large. Please select a file smaller than 5MB. Current file size: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
          e.target.value = '' // Clear the input
          return
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
          alert('Please select an image file (JPG, PNG, GIF, etc.)')
          e.target.value = '' // Clear the input
          return
        }

        setUploadingImage(true)
        
        // Create FormData object to package the file for the backend
        const formData = new FormData()
        // 'image' must match the key expected by Multer on the backend (upload.single('image'))
        formData.append('image', file) 
        
        try {
          // Send the file via the modified apiSend utility
          // The backend endpoint is /api/upload/cms-image
          const response = await apiSend('/api/upload/cms-image', 'POST', formData) 
          
          // Assuming the backend returns the Cloudinary URL in response.url
          const downloadURL = response.url
          
          // Update form with the new image URL
          setForm({ ...form, imageUrl: downloadURL })
          
          console.log('Image uploaded successfully:', downloadURL)
        } catch (error) {
          console.error('Error uploading image:', error)
          alert('Failed to upload image. Please check console for details.')
        } finally {
          setUploadingImage(false)
          e.target.value = '' // Clear the input after upload attempt
        }
  }

  async function save() {
    // Validate required fields
    if (!form.title.trim()) {
      alert('Please enter a title')
      setSaving(false)
      return
    }

    if (!form.slug.trim()) {
      alert('Please enter a slug. The slug is required for CMS pages.')
      setSaving(false)
      return
    }

    setSaving(true)
    // ++ Ensure 'secondSectionEmbed' sends null if empty string ++
    const payload = { 
      title: form.title.trim(),
      slug: form.slug.trim(),
      content: form.content || '',
      imageUrl: form.imageUrl || '',
      secondSectionEmbed: form.secondSectionEmbed || null 
    };
    
    console.log('💾 Saving CMS page with payload:', payload);
    console.log('🔗 Embed ID being saved:', payload.secondSectionEmbed);
    
    try {
      if (isNew) await apiSend('/api/cms', 'POST', payload)
      else await apiSend(`/api/cms/${id}`, 'PUT', payload)
      
      console.log('✅ CMS page saved successfully!');
      alert('CMS page saved successfully!')
      navigate('/admin/cms')
    } catch (error) {
      console.error('❌ Error saving CMS page:', error)
      alert(`Failed to save: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{isNew ? 'Add Page' : 'Edit Page'}</h1>
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-6 space-y-5 max-w-3xl">
        
        {/* Title */}
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Title <span className="text-red-600">*</span></span>
          <input
            value={form.title}
            onChange={e => {
              setForm({ ...form, title: e.target.value })
              // Auto-generate slug if slug is empty
              if (!form.slug) {
                const autoSlug = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9\s-]/g, '')
                  .replace(/\s+/g, '-')
                  .replace(/-+/g, '-')
                  .trim()
                setForm(prev => ({ ...prev, title: e.target.value, slug: autoSlug }))
              }
            }}
            placeholder="Enter page title..."
            className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 
                       text-gray-800 focus:outline-none focus:border-red-600 focus:ring-2 
                       focus:ring-red-100 transition-all duration-200"
            required
          />
        </label>

        {/* Slug */}
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Slug <span className="text-red-600">*</span></span>
          <input
            value={form.slug || ''}
            onChange={e => setForm({ ...form, slug: e.target.value })}
            placeholder="e.g. about-us (required for URL routing)"
            className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 
                       text-gray-800 focus:outline-none focus:border-red-600 focus:ring-2 
                       focus:ring-red-100 transition-all duration-200"
            required
          />
          <p className="text-xs text-gray-500 mt-1">URL-friendly identifier for this page. This is required.</p>
        </label>

        {/* Image Upload (for first image) */}
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Page Image (Optional - First Section)</span>
          <div className="mt-2 space-y-3">
            {/* Current Image Preview */}
            {form.imageUrl && (
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Current Image:</p>
                <img 
                  src={form.imageUrl} 
                  alt="Current page image" 
                  className="max-w-xs max-h-48 object-contain rounded-md border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, imageUrl: '' })}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Remove Image
                </button>
              </div>
            )}
            
            {/* File Upload Input */}
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer transition disabled:opacity-50"
              />
              {uploadingImage && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Uploading...
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">Upload an image for this page (max 5MB, JPG/PNG/GIF)</p>
          </div>
        </label>

        {/* ++ ADD EMBED SELECTION DROPDOWN ++ */}
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Second Section Embed (AI/H5P)</span>
          <select
            value={form.secondSectionEmbed || ''} // Use empty string for the "None" option
            onChange={e => setForm({ ...form, secondSectionEmbed: e.target.value || null })}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 
                       text-gray-800 focus:outline-none focus:border-red-600 focus:ring-2 
                       focus:ring-red-100 transition-all duration-200"
          >
            <option value="">-- None (Show only text/image) --</option>
            {availableEmbeds.map(embed => (
              <option key={embed._id} value={embed._id}>
                {embed.title} ({embed.type})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Select an AI or H5P embed to display in the first section. This will replace the "Page Image" above.</p>
        </label>

        {/* Content Editor */}
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Content</span>
          <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-100 transition-all duration-200">
            <Editor
              apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
              value={form.content}
              onEditorChange={(v) => setForm({ ...form, content: v })}
              init={{
                height: 400,
                menubar: false,
                plugins: 'link lists table code fullscreen image media',
                toolbar:
                  'undo redo | formatselect | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image media | table | code fullscreen',
                content_style:
                  'body { font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; font-size:14px; color:#111827; background-color:#fff }'
              }}
            />
          </div>
        </label>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => navigate('/admin/cms')}
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || uploadingImage}
            className="px-4 py-2 rounded-md bg-red-700 text-white hover:bg-red-800 
                       disabled:opacity-60 transition"
          >
            {saving ? 'Saving...' : uploadingImage ? 'Uploading Image...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}