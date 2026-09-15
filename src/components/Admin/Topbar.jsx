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
    <header className="h-16 border-b-[1.5px] border-casa-ink/10 bg-casa-creamLight/92 backdrop-blur-[14px] flex items-center px-4 justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden w-10 h-10 rounded-full border-2 border-casa-ink bg-casa-creamLight shadow-[0_3px_0_rgba(23,17,14,.28)] hover:bg-casa-gold hover:translate-y-0.5 hover:shadow-[0_1px_0_rgba(23,17,14,.28)] transition-all"
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
        >
          <span>☰</span>
        </button>
        <Link to="/admin" className="flex items-center gap-2 group">
          <img src="/Horizontal_1.svg" alt="Casa De ELE" className="h-8 w-auto transition-transform duration-500 group-hover:scale-[1.03]" />
          <span className="hidden sm:inline font-body font-semibold text-[13px] tracking-[0.14em] uppercase text-casa-ink/55">Admin Panel</span>
        </Link>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          className="w-10 h-10 rounded-full bg-casa-gold border-2 border-casa-ink shadow-[0_3px_0_rgba(23,17,14,.28)] hover:bg-casa-red hover:translate-y-0.5 hover:shadow-[0_1px_0_rgba(23,17,14,.28)] transition-all"
          onClick={() => setOpen(v => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
        />
        {open && (
          <div className="absolute right-0 mt-3 w-44 bg-casa-creamLight border-2 border-casa-ink rounded-2xl shadow-[0_6px_0_rgba(23,17,14,.22)] p-1.5 text-[14.5px] font-semibold overflow-hidden">
            <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-casa-red/10 hover:text-casa-redDark transition-colors">Settings</button>
            <button
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-casa-red/10 hover:text-casa-redDark transition-colors"
              onClick={async () => { try { await signOut(auth) } catch(_) {} localStorage.removeItem('authToken'); window.location.href='/admin/login' }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}


