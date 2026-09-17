import { NavLink } from 'react-router-dom'
import { FiHome, FiUsers, FiUpload, FiBox, FiShoppingCart, FiSettings, FiFileText, FiTag, FiMail, FiGlobe, FiLayers, FiCpu, FiShare2, FiStar, FiDownload, FiBookOpen, FiEdit3 } from 'react-icons/fi'

const links = [
  { to: '/admin', label: 'Dashboard', icon: FiHome },
  { to: '/admin/users', label: 'Users', icon: FiUsers },
  { to: '/admin/products', label: 'Products', icon: FiBox },
  { to: '/admin/orders', label: 'Orders', icon: FiShoppingCart },
  { to: '/admin/materials', label: 'Materials', icon: FiLayers },
  { to: '/admin/feedback', label: 'Feedback', icon: FiStar },
  { to: '/admin/courses', label: 'Courses', icon: FiFileText },
  { to: '/admin/categories', label: 'Categories', icon: FiTag },
  { to: '/admin/forms', label: 'Forms', icon: FiMail },
  { to: '/admin/coupons', label: 'Coupons', icon: FiTag },
  { to: '/admin/manage-admins', label: 'Manage Admins', icon: FiUsers },
  { to: '/admin/subscribers', label: 'Subscribers', icon: FiMail },
  { to: '/admin/embeds', label: 'Embeds & Chapters', icon: FiCpu },
  { to: '/admin/digital-downloads', label: 'Digital Downloads', icon: FiDownload },
  { to: '/admin/pinterest', label: 'Pinterest Manager', icon: FiShare2 },
  { to: '/admin/testimonials', label: 'Testimonials', icon: FiMail },
  { to: '/admin/teachers', label: 'Teachers', icon: FiUsers },
  { to: '/admin/magazines', label: 'Magazines', icon: FiBookOpen },
  { to: '/admin/texts', label: 'Texts', icon: FiEdit3 },
]

export default function AdminSidebar({ open, onClose }) {
  return (
    <aside className={`fixed z-40 inset-y-0 left-0 w-64 bg-casa-ink border-r-2 border-casa-ink transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="h-16 flex items-center gap-2.5 px-4 sticky top-0 bg-casa-ink z-10 border-b border-casa-creamLight/15">
        <img src="/my-logo.png" alt="" className="w-8 h-8 shrink-0" />
        <span className="font-heading font-black text-[15px] leading-none tracking-tight text-casa-creamLight">
          Casa de ELE
          <span className="block text-[11px] font-body font-semibold tracking-[0.14em] uppercase text-casa-gold mt-1">Admin</span>
        </span>
      </div>
      <nav className="px-2.5 py-4 space-y-1 overflow-y-auto no-scrollbar max-h-[calc(100vh-4rem)]">
        {links.map(link => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `group flex items-center gap-3 px-3 py-2.5 rounded-full text-[14.5px] font-semibold transition-all duration-200 ${isActive ? 'bg-casa-red text-white shadow-[0_3px_0_#6f1216]' : 'text-casa-creamLight/80 hover:text-casa-gold hover:translate-x-1.5'}`}
              onClick={onClose}
              end={link.to === '/admin'}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-casa-creamLight/55 group-hover:text-casa-gold'}`} />
                  <span className="truncate">{link.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}


