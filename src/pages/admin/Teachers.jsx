import { useEffect, useState } from 'react'
import { apiGet, apiSend } from '../../utils/api'

export default function Teachers() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', photoUrl: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imgMode, setImgMode] = useState('url')

  const load = () => {
    setLoading(true)
    apiGet('/api/teachers')
      .then(setItems)
      .catch(e => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm({ name: '', photoUrl: '', description: '' }); setImgMode('url'); setModalOpen(true) }
  const openEdit = (t) => { setEditing(t); setForm({ name: t.name, photoUrl: t.photoUrl, description: t.description }); setImgMode('url'); setModalOpen(true) }

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { timestamp, signature } = await apiGet('/api/cloudinary-signature');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', import.meta.env.VITE_CLOUDINARY_API_KEY);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('upload_preset', 'casadeele_materials');

      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Cloudinary upload failed');
      }

      const data = await response.json();
      setForm({ ...form, photoUrl: data.secure_url });
    } catch (error) {
      console.error('Upload failed', error);
      alert('File upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true)
    try {
      if (!form.name.trim() || !form.photoUrl.trim() || !form.description.trim()) throw new Error('Fill all fields')
      const payload = { name: form.name.trim(), photoUrl: form.photoUrl.trim(), description: form.description.trim() }
      const res = editing
        ? await apiSend(`/api/teachers/${editing._id}`, 'PUT', payload)
        : await apiSend('/api/teachers', 'POST', payload)
      if (editing) setItems(items.map(x => x._id === res._id ? res : x))
      else setItems([res, ...items])
      setModalOpen(false)
      window.dispatchEvent(new Event('teachers:updated'))
    } catch (e) { alert(e?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this teacher?')) return
    try {
      await apiSend(`/api/teachers/${id}`, 'DELETE')
      setItems(items.filter(x => x._id !== id))
      window.dispatchEvent(new Event('teachers:updated'))
    } catch (e) { alert(e?.message || 'Delete failed') }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Teachers</h1>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-3 border-b flex justify-between items-center">
          <div className="text-sm text-gray-600">Manage teachers</div>
          <button onClick={openNew} className="px-3 py-1.5 rounded-md bg-red-700 text-white hover:bg-red-800">Add Teacher</button>
        </div>

        <table className="min-w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td className="px-4 py-3" colSpan={4}>Loading...</td></tr>
            ) : items.map(t => (
              <tr key={t._id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><img src={t.photoUrl} alt={t.name} className="w-12 h-12 rounded-full object-cover" /></td>
                <td className="px-4 py-3 font-medium text-gray-800">{t.name}</td>
                <td className="px-4 py-3 text-gray-700 max-w-md truncate" title={t.description}>{t.description}</td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => openEdit(t)} className="px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">Edit</button>
                  <button onClick={() => remove(t._id)} className="px-3 py-1 rounded bg-gray-100 text-gray-800 hover:bg-gray-200">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="text-lg font-semibold">{editing ? 'Edit teacher' : 'Add teacher'}</div>
            <div className="grid grid-cols-1 gap-3">
              <label className="block">
                <span className="text-sm text-gray-700">Name</span>
                <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm" />
              </label>
              <div className="block">
                <span className="text-sm text-gray-700">Photo</span>
                <div className="mt-1 flex items-center gap-4 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="imgMode" checked={imgMode === 'url'} onChange={() => setImgMode('url')} /> URL
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="imgMode" checked={imgMode === 'upload'} onChange={() => setImgMode('upload')} /> Upload
                  </label>
                </div>
              </div>
              {imgMode === 'url' ? (
                <label className="block">
                  <span className="text-sm text-gray-700">Photo URL</span>
                  <input value={form.photoUrl} onChange={e=>setForm({...form, photoUrl:e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm" />
                </label>
              ) : (
                <label className="block">
                  <span className="text-sm text-gray-700">Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer transition"
                  />
                  {uploading && <div className="text-sm text-gray-500 mt-1">Uploading...</div>}
                  {form.photoUrl && !uploading && imgMode === 'upload' && (
                    <div className="text-sm text-green-600 mt-1">Upload complete. URL saved.</div>
                  )}
                </label>
              )}
              {(form.photoUrl || (imgMode === 'upload' && form.photoUrl)) && (
                <div className="mt-2 border rounded-lg p-2">
                  <div className="text-xs text-gray-500 mb-1">Preview</div>
                  <img src={form.photoUrl} alt="preview" className="max-h-32 object-contain rounded-md border border-gray-200" />
                </div>
              )}
              <label className="block">
                <span className="text-sm text-gray-700">Short Description</span>
                <textarea rows={3} value={form.description} onChange={e=>setForm({...form, description:e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm" />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setModalOpen(false)} className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200">Cancel</button>
              <button onClick={save} disabled={saving || uploading} className="px-3 py-1.5 rounded-md bg-red-700 text-white hover:bg-red-800 disabled:opacity-60">{saving?'Saving…':uploading?'Uploading...':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


