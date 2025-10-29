import React, { useState, useEffect } from 'react';
import { apiGet, apiSend } from '../../utils/api';
import { FiRefreshCw, FiTrash2 } from 'react-icons/fi';

function GardenContent() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState('')
  const [actingType, setActingType] = useState('')

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/suggestions');
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const deleteSuggestion = async (id) => {
    if (!confirm('Delete this suggestion?')) return
    try {
      setActingId(id)
      setActingType('delete')
      
      // Optimistic UI
      setSuggestions(prev => prev.filter(x => x._id !== id))
      
      await apiSend(`/api/suggestions/${id}`, 'DELETE')
    } catch (e) { 
      alert(e?.message || 'Delete failed')
      // Revert optimistic update on error
      fetchSuggestions()
    }
    finally { setActingId(''); setActingType('') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Garden of Ideas - User Suggestions</h1>
        <div className="flex items-center gap-2">
          <button onClick={fetchSuggestions} disabled={loading} className="px-3 py-1.5 rounded-md border hover:bg-gray-50 transition"><FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-3 border-b text-sm text-gray-600">Manage user feedback and suggestions</div>
        <table className="min-w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Suggestion</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td className="px-4 py-3" colSpan={5}>Loading...</td></tr>
            ) : suggestions.length === 0 ? (
              <tr><td className="px-4 py-3 text-center text-gray-500" colSpan={5}>No suggestions yet</td></tr>
            ) : suggestions.map(s => (
              <tr key={s._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                <td className="px-4 py-3 text-gray-700">{s.email}</td>
                <td className="px-4 py-3 text-gray-700 max-w-md">
                  <div className="truncate" title={s.message}>{s.message}</div>
                </td>
                <td className="px-4 py-3 text-gray-700 text-sm">{new Date(s.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button 
                    disabled={actingId===s._id} 
                    onClick={() => deleteSuggestion(s._id)} 
                    className="px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60 flex items-center gap-1"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    {actingId===s._id && actingType==='delete' ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GardenContent;