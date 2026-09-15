// src/pages/admin/Users.jsx

import { useEffect, useMemo, useState } from 'react';
// Import your apiGet and apiSend functions
import { apiGet, apiSend } from '../../utils/api';

export default function Users() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState({ key: 'name', dir: 'asc' });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // CORRECTED: This function now uses apiGet
  const fetchUsers = () => {
    setLoading(true);
    apiGet('/api/users')
      .then(data => setRows(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setRows([]);
        setMessage({ type: 'error', text: 'Failed to load users.' });
      })
      .finally(() => setLoading(false));
  };
  
  useEffect(fetchUsers, []);

  const isSuperAdmin = useMemo(() => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return false;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.email === import.meta.env.VITE_SUPER_ADMIN_EMAIL;
    } catch {
      return false;
    }
  }, []);

  const sorted = useMemo(() => {
    const filtered = rows.filter(r => {
      const s = search.toLowerCase();
      return (!s || (r.name || '').toLowerCase().includes(s) || (r.email || '').toLowerCase().includes(s)) &&
             (!roleFilter || (r.role || 'user').toLowerCase() === roleFilter) &&
             (!statusFilter || (r.status || 'Active').toLowerCase() === statusFilter);
    });

    return [...filtered].sort((a, b) => {
      const va = (a[sortBy.key] || '').toString().toLowerCase();
      const vb = (b[sortBy.key] || '').toString().toLowerCase();
      if (va < vb) return sortBy.dir === 'asc' ? -1 : 1;
      if (va > vb) return sortBy.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortBy, search, roleFilter, statusFilter]);

  function setSort(key){
    setSortBy(p => p.key === key ? { key, dir: p.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  }

  async function handleMakeAdmin(user) {
    if (!window.confirm(`Are you sure you want to make ${user.email} an admin?`)) return;
    
    setMessage({ type: '', text: '' });
    try {
      // CORRECTED: This now uses apiSend
      const res = await apiSend('/api/admins/promote', 'POST', { email: user.email });
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        // Optimistically update the UI
        setRows(rows.map(r => r.uid === user.uid ? { ...r, role: 'admin' } : r));
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to promote user.' });
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>
      {message.text && (
        <div className={`p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-casa-red/8 text-casa-red'}`}>
          {message.text}
        </div>
      )}
      <div className="rounded-xl bg-white shadow-sm border border-casa-ink/12 p-4 flex flex-col md:flex-row gap-3">
        <input
          placeholder="Search by name or email"
          value={search}
          onChange={e=>setSearch(e.target.value)}
          className="w-full md:flex-1 rounded-xl border border-casa-ink/20 bg-casa-cream/40 px-3 py-2 text-sm shadow-sm 
                     focus:border-casa-red focus:ring-2 focus:ring-casa-red/30 focus:bg-white 
                     transition-all duration-200 placeholder-gray-400"
        />
        <select 
          value={roleFilter} 
          onChange={e=>setRoleFilter(e.target.value)} 
          className="rounded-xl border border-casa-ink/20 bg-casa-cream/40 px-3 py-2 text-sm shadow-sm 
                     focus:border-casa-red focus:ring-2 focus:ring-casa-red/30 focus:bg-white 
                     transition-all duration-200"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <select 
          value={statusFilter} 
          onChange={e=>setStatusFilter(e.target.value)} 
          className="rounded-xl border border-casa-ink/20 bg-casa-cream/40 px-3 py-2 text-sm shadow-sm 
                     focus:border-casa-red focus:ring-2 focus:ring-casa-red/30 focus:bg-white 
                     transition-all duration-200"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>
      <div className="rounded-xl bg-white shadow-sm border border-casa-ink/12 overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className="min-w-full text-left">
            <thead className="bg-casa-cream/40 text-casa-ink/65 text-sm">
              <tr>
                <th className="px-4 py-3 cursor-pointer" onClick={()=>setSort('name')}>Name</th>
                <th className="px-4 py-3 cursor-pointer" onClick={()=>setSort('email')}>Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                {isSuperAdmin && <th className="px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? Array.from({length:5}).map((_,i)=>( 
                <tr key={i}><td colSpan={isSuperAdmin ? 6 : 5} className="px-4 py-3"><div className="h-4 w-full bg-casa-cream/60 animate-pulse rounded" /></td></tr>
              )) : sorted.map((r, i) => (
                <tr key={i} className="hover:bg-casa-cream/40">
                  <td className="px-4 py-3 font-medium text-casa-ink">{r.name || '-'}</td>
                  <td className="px-4 py-3 text-casa-ink/75">{r.email || '-'}</td>
                  <td className="px-4 py-3 text-casa-ink/75 capitalize">{r.role || 'user'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${r.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>{r.status || 'Active'}</span>
                  </td>
                  <td className="px-4 py-3 text-casa-ink/75 text-sm">{r.creationTime ? new Date(r.creationTime).toLocaleDateString() : '-'}</td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3">
                      {(r.role || 'user') === 'user' && (
                        <button onClick={() => handleMakeAdmin(r)} className="px-3 py-1 rounded bg-casa-red/8 text-casa-red hover:bg-red-100 transition text-sm">
                          Make Admin
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}