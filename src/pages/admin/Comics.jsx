import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiImage, FiX, FiFile, FiEye, FiEyeOff } from 'react-icons/fi';
import { apiGet, apiSend } from '../../utils/api';
import LazyTinyMCE from '../../components/Admin/LazyTinyMCE';
import Spinner from '../../components/Common/Spinner';

// Comics are Magazine documents with contentType: 'comic' — the same
// collection the "Magazines" admin section manages, filtered/locked here so
// editors have a dedicated place for student/teacher comic strips, without
// wading through full issues and single texts. See Backend/models/Magazine.js
// and El Desvelo.dc.html's `comics` binding (GET /api/magazines, contentType==='comic').
const Comics = () => {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingComic, setEditingComic] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    coverImageUrl: '',
    pdfUrl: '',
    category: '',
    accessType: 'free',
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      description: '',
      coverImageUrl: '',
      pdfUrl: '',
      category: '',
      accessType: 'free',
      isActive: true,
    });
    setEditingComic(null);
  };

  const fetchComics = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/magazines?all=true&limit=100');
      const all = data.magazines || [];
      setComics(all.filter((m) => m.contentType === 'comic'));
    } catch (error) {
      console.error('Error fetching comics:', error);
      setComics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComics();
  }, []);

  // TEMP: one-off migration of the 4 real comics that used to live in the
  // shop's Products catalog (category "Rincón de cuentos" / "Aprender de
  // cuentos") into this collection, reusing their real Cloudinary covers and
  // Drive-hosted PDFs. Remove this block after running it once.
  const [migrating, setMigrating] = useState(false);
  const runMigration = async () => {
    const items = [
      {
        title: 'Hissss | A comic',
        category: 'A1',
        coverImageUrl: 'https://res.cloudinary.com/do15wnnhu/image/upload/v1777704135/d5fo6oppnti8s9ce3pn8.jpg',
        pdfUrl: 'gdrive://1PGmmIT3YfhEsEE9KLdIcbhbdEDxv_AIi',
        description: '<p><strong>HISSSS: A Comic Doodle</strong> Written by Ritika | Illustrated by Deepika</p><p>Ishaan, a hardworking university student, has a single unexpected moment shatter the silence of his home. A tense, nail-biting night for the whole family, told entirely in Spanish with a vocabulary guide included.</p>',
      },
      {
        title: 'Fritz',
        category: 'A1-A2',
        coverImageUrl: 'https://res.cloudinary.com/do15wnnhu/image/upload/v1776773621/zhhb58vlmbdkkuqxx0wt.jpg',
        pdfUrl: 'gdrive://1SKee8IcUIymQO0VWsBKHwz3MhuxMl0mM',
        description: '<p><strong>FRITZ</strong> — A horror story in español based on Satyajit Ray</p><p>A childhood toy. A buried secret. A chilling Spanish-language comic adapted from the Bengali writer and filmmaker Satyajit Ray, written by university students Anshul Singh and Vaishnvi Rawat for beginner learners.</p>',
      },
      {
        title: 'Su boda',
        category: 'A2-B1',
        coverImageUrl: 'https://res.cloudinary.com/do15wnnhu/image/upload/v1771985323/yxg2kxzfliphosj1bcpf.jpg',
        pdfUrl: 'gdrive://1optJzhCJCqiNtvsQgPCXLqEISv5HH3Ag',
        description: '<p>Fresh from London\'s buzz, she\'s back in India for a homecoming twist — reunited with family, but slammed by the ultimate single-girl dilemma: parents on a groom-hunting frenzy. Created by Aarchi Agarwal, illustrated by Arsalan Khan.</p>',
      },
      {
        title: 'Solo vine a hablar por teléfono',
        category: 'B2-C1',
        coverImageUrl: 'https://res.cloudinary.com/do15wnnhu/image/upload/v1771727066/joixzad9mde4duhelag1.jpg',
        pdfUrl: 'gdrive://1Bk9OEbNaoInvDLdryJK5vNi8ZsApgfc5',
        description: '<p>Uno de los cuentos de "Doce cuentos peregrinos" de Gabriel García Márquez, parte de la serie "Aprender de cuentos" — didactizado con actividades de comprensión de lectura.</p>',
      },
    ];
    setMigrating(true);
    try {
      for (const item of items) {
        const saved = await apiSend('/api/magazines', 'POST', { ...item, contentType: 'comic', accessType: 'free', isActive: true });
        setComics(prev => [saved, ...prev]);
      }
      setSuccessMsg('Migrated 4 comics from Products!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      console.error('Migration failed:', error);
      alert('Migration failed. Check console.');
    } finally {
      setMigrating(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = 'casadeele_materials';

    try {
      const cloudFormData = new FormData();
      cloudFormData.append('file', file);
      cloudFormData.append('upload_preset', uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: cloudFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, coverImageUrl: data.secure_url }));
    } catch (error) {
      console.error('Cover upload error:', error);
      alert(`Cover upload failed: ${error.message}`);
    } finally {
      setUploadingCover(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }

    setUploadingPdf(true);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiBaseUrl}/api/uploads/magazine-pdf`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, pdfUrl: data.url }));
    } catch (error) {
      console.error('PDF upload error:', error);
      alert(`PDF upload failed: ${error.message}`);
    } finally {
      setUploadingPdf(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!formData.coverImageUrl) {
        alert('Please upload a cover image.');
        setIsSaving(false);
        return;
      }
      if (!formData.pdfUrl) {
        alert('Please upload a PDF file.');
        setIsSaving(false);
        return;
      }

      const payload = { ...formData, contentType: 'comic' };

      const url = editingComic ? `/api/magazines/${editingComic._id}` : '/api/magazines';
      const method = editingComic ? 'PUT' : 'POST';
      const saved = await apiSend(url, method, payload);

      if (editingComic) {
        setComics(prev => prev.map(c => (c._id === saved._id ? saved : c)));
      } else {
        setComics(prev => [saved, ...prev]);
      }

      setShowModal(false);
      resetForm();
      setSuccessMsg(editingComic ? 'Comic updated!' : 'Comic created!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Failed to save comic:', error);
      alert('Failed to save comic. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (comic) => {
    setEditingComic(comic);
    setFormData({
      title: comic.title || '',
      slug: comic.slug || '',
      description: comic.description || '',
      coverImageUrl: comic.coverImageUrl || '',
      pdfUrl: comic.pdfUrl || '',
      category: comic.category || '',
      accessType: comic.accessType || 'free',
      isActive: comic.isActive !== false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('This will permanently delete. Are you sure?')) {
      try {
        await apiSend(`/api/magazines/${id}`, 'DELETE');
        setComics(prev => prev.filter(c => c._id !== id));
        setSuccessMsg('Comic deleted successfully');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (error) {
        console.error('Error deleting comic:', error);
        alert('Failed to delete comic.');
      }
    }
  };

  const handleToggleActive = async (id, currentIsActive) => {
    try {
      const newActive = currentIsActive === false ? true : false;
      const updated = await apiSend(`/api/magazines/${id}/toggle-active`, 'PATCH', { isActive: newActive });
      setComics(prev => prev.map(item => item._id === id ? { ...item, isActive: updated.isActive } : item));
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Failed to toggle visibility');
    }
  };

  return (
    <div className="p-6 bg-casa-cream/40 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {successMsg && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
            {successMsg}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-casa-ink mb-2">Comics</h1>
              <p className="text-casa-ink/65">Short strips drawn by students and teachers — shown in the "Comics" section of the editorial page.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={runMigration}
                disabled={migrating}
                className="bg-casa-ink text-white px-4 py-3 rounded-xl hover:opacity-90 transition-colors disabled:opacity-50"
              >
                {migrating ? 'Migrating…' : 'TEMP: Migrate 4 from Products'}
              </button>
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="bg-casa-red text-white px-6 py-3 rounded-xl hover:bg-casa-redDark transition-colors flex items-center gap-2"
              >
                <FiPlus className="w-5 h-5" /> Add Comic
              </button>
            </div>
          </div>
        </div>

        {/* Comics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12"><Spinner /> Loading comics...</div>
          ) : comics.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FiFile className="w-12 h-12 text-casa-ink/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-casa-ink mb-2">No comics found</h3>
              <p className="text-casa-ink/50">Get started by adding your first comic.</p>
            </div>
          ) : (
            comics.map((comic) => (
              <div key={comic._id} className="bg-white rounded-xl shadow-sm border border-casa-ink/12 overflow-hidden hover:shadow-md transition-shadow">
                {comic.coverImageUrl ? (
                  <div className="h-48 bg-gray-200">
                    <img src={comic.coverImageUrl} alt={comic.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    <FiImage className="w-12 h-12 text-casa-ink/40" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-casa-ink line-clamp-2 flex-1">{comic.title}</h3>
                    {comic.isActive === false && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">Hidden</span>
                    )}
                  </div>
                  {comic.description && (
                    <div className="text-casa-ink/65 text-sm mb-3 line-clamp-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: comic.description }} />
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">Comic</span>
                    {comic.category && (
                      <span className="px-2 py-0.5 text-xs bg-gray-200 text-casa-ink/75 rounded-full">{comic.category}</span>
                    )}
                    <span className={`px-2 py-0.5 text-xs rounded-full ${comic.accessType === 'paid' ? 'bg-red-100 text-casa-red' : 'bg-green-100 text-green-700'}`}>
                      {comic.accessType === 'paid' ? 'Paid' : 'Free'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-casa-ink/50 mb-4">
                    <span>{new Date(comic.publishedAt || comic.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(comic)} className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50">
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(comic._id, comic.isActive)}
                        className={comic.isActive === false ? "text-yellow-600 hover:text-yellow-800 p-2 rounded hover:bg-yellow-50" : "text-casa-ink/40 hover:text-gray-600 p-2 rounded hover:bg-casa-cream/40"}
                        title={comic.isActive === false ? "Show to users" : "Hide from users"}
                      >
                        {comic.isActive === false ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDelete(comic._id)} className="text-casa-red hover:text-red-900 p-2 rounded hover:bg-casa-red/8">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {comic.pdfUrl && (
                      <a href={comic.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-casa-red hover:text-casa-redDark text-xs font-medium">
                        View PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comic Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-casa-ink/12 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-casa-ink">{editingComic ? 'Edit Comic' : 'Add New Comic'}</h3>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-casa-ink/40 hover:text-gray-600">
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Title + Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-casa-ink/75 mb-1">Title *</label>
                    <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-casa-ink/20 rounded-xl focus:ring-casa-red focus:border-casa-red" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-casa-ink/75 mb-1">Level / Category</label>
                    <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border border-casa-ink/20 rounded-xl focus:ring-casa-red focus:border-casa-red" placeholder="e.g., A2, Rincón de cuentos..." />
                  </div>
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-casa-ink/75 mb-1">URL Slug</label>
                  <input type="text" value={formData.slug || ''} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder={formData.title ? formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'auto-generated-from-title'} className="w-full px-3 py-2 border border-casa-ink/20 rounded-xl focus:ring-casa-red focus:border-casa-red font-mono text-sm" />
                  <p className="mt-1 text-xs text-casa-ink/50">Leave blank to auto-generate from title.</p>
                </div>

                {/* Description (shown as the excerpt on the Comics card) */}
                <div>
                  <label className="block text-sm font-medium text-casa-ink/75 mb-1">Excerpt / Description</label>
                  <div className="mt-1 rounded-xl overflow-hidden border border-casa-ink/12 focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-100 transition-all duration-200">
                    <LazyTinyMCE
                      apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                      value={formData.description}
                      onEditorChange={(v) => setFormData({ ...formData, description: v })}
                      init={{
                        height: 200,
                        menubar: false,
                        plugins: 'link lists table code fullscreen',
                        toolbar:
                          'undo redo | formatselect | bold italic underline | bullist numlist | link | code',
                        placeholder: 'Short excerpt shown on the comic card...',
                        content_style:
                          'body { font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; font-size:14px; color:#111827; background-color:#fff }'
                      }}
                    />
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-casa-ink/75 mb-1">Cover Image *</label>
                  {formData.coverImageUrl ? (
                    <div className="relative inline-block mb-2">
                      <img src={formData.coverImageUrl} alt="Cover" className="h-40 rounded-xl object-cover border border-casa-ink/12" />
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, coverImageUrl: '' }))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-casa-redDark">
                        <FiX className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null}
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="w-full text-sm text-casa-ink/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
                  {uploadingCover && <p className="text-sm text-casa-ink/50 mt-1 animate-pulse">Uploading cover image...</p>}
                </div>

                {/* PDF Upload */}
                <div>
                  <label className="block text-sm font-medium text-casa-ink/75 mb-1">Comic PDF *</label>
                  {formData.pdfUrl ? (
                    <div className="flex items-center gap-3 mb-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <FiFile className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-800 flex-1 truncate">PDF uploaded</span>
                      <a href={formData.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 underline">Preview</a>
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, pdfUrl: '' }))} className="text-red-500 hover:text-casa-redDark">
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : null}
                  <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="w-full text-sm text-casa-ink/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
                  {uploadingPdf && <p className="text-sm text-casa-ink/50 mt-1 animate-pulse">Uploading PDF...</p>}
                </div>

                {/* Access Type Toggle */}
                <div className="border border-casa-ink/12 rounded-xl p-4 bg-casa-cream/40">
                  <h4 className="text-sm font-semibold text-casa-ink mb-3">Access Type</h4>
                  <div className="flex items-center gap-4">
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors ${formData.accessType === 'free' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-casa-ink/20 text-casa-ink/65'}`}>
                      <input type="radio" name="accessType" value="free" checked={formData.accessType === 'free'} onChange={(e) => setFormData({ ...formData, accessType: e.target.value })} className="accent-green-600" />
                      <span className="font-medium text-sm">Free</span>
                    </label>
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors ${formData.accessType === 'paid' ? 'bg-casa-red/8 border-red-300 text-casa-red' : 'bg-white border-casa-ink/20 text-casa-ink/65'}`}>
                      <input type="radio" name="accessType" value="paid" checked={formData.accessType === 'paid'} onChange={(e) => setFormData({ ...formData, accessType: e.target.value })} className="accent-red-600" />
                      <span className="font-medium text-sm">Paid</span>
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-casa-ink/50">Free comics link straight to the download. Paid ones show "Available to members" until purchase support is added.</p>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                  <span className="text-sm font-medium text-casa-ink/75">
                    {formData.isActive ? 'Published' : 'Draft'}
                  </span>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-4 border-t border-casa-ink/12">
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 text-casa-ink/75 bg-casa-cream/60 rounded-xl hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving || uploadingCover || uploadingPdf} className="px-6 py-2 bg-casa-red text-white rounded-xl hover:bg-casa-redDark disabled:opacity-50 transition-colors flex items-center gap-2">
                    {isSaving ? 'Saving...' : (editingComic ? 'Update Comic' : 'Create Comic')}
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

export default Comics;
