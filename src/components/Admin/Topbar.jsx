import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { auth } from '../../firebase'
import { signOut } from 'firebase/auth'

export default function AdminTopbar({ onMenuClick }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="h-16 border-b border-gray-200 bg-white/95 backdrop-blur flex items-center px-4 justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <button className="md:hidden p-2 rounded hover:bg-gray-100" onClick={onMenuClick} aria-label="Toggle sidebar">
          <span>☰</span>
        </button>
        <Link to="/admin" className="flex items-center gap-2 font-semibold group">
          <img src="/Horizontal_1.svg" alt="Casa De ELE" className="h-8 w-auto transition-transform duration-150 group-hover:scale-[1.02]" />
          <span className="hidden sm:inline">| Admin Panel</span>
        </Link>
      </div>

      <div className="relative" ref={menuRef}>
        <button className="w-9 h-9 rounded-full bg-gray-300 ring-1 ring-gray-300 hover:ring-gray-400 transition" onClick={() => setOpen(v => !v)} aria-haspopup="menu" aria-expanded={open} />
        {open && (
          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 shadow-lg rounded-md py-1 text-sm">
            <button className="w-full text-left px-3 py-2 hover:bg-gray-50">Settings</button>
            <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={async () => { try { await signOut(auth) } catch(_) {} localStorage.removeItem('authToken'); window.location.href='/admin/login' }}>Logout</button>
          </div>
        )}
      </div>
    </header>
  )
}


