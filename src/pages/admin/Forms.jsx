import { useEffect, useState } from 'react'
import { apiGet } from '../../utils/api'

export default function Forms() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet('/api/forms')
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((err) => { console.error('Failed to load forms', err); setRows([]) })
      .finally(() => setLoading(false))
  }, [])

  async function exportExcel() {
    const token = localStorage.getItem('authToken')
    const res = await fetch('/api/forms/export', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    if (!res.ok) return
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'form_submissions.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Forms</h1>
        <button onClick={exportExcel} className="px-3 py-1.5 rounded-md bg-red-700 text-white hover:bg-red-800">Export to Excel</button>
      </div>
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}><td className="px-4 py-3"><div className="h-4 w-40 bg-gray-100 animate-pulse rounded" /></td><td /><td /><td /></tr>
            )) : rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                <td className="px-4 py-3 text-gray-700">{r.email}</td>
                <td className="px-4 py-3 text-gray-700 truncate max-w-md">{r.message}</td>
                <td className="px-4 py-3 text-gray-700">{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


