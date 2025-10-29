import { Link } from 'react-router-dom'

export default function AdminNotFound() {
  return (
    <div className="py-12 text-center">
      <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
      <p className="text-gray-600 mb-6">The page you are looking for does not exist.</p>
      <Link to="/admin" className="inline-flex px-4 py-2 rounded-md bg-red-700 text-white hover:bg-red-800">Go to Dashboard</Link>
    </div>
  )
}


