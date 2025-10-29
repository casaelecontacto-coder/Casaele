import { NavLink } from 'react-router-dom'
import { FiHome, FiUsers, FiUpload, FiBox, FiShoppingCart, FiSettings, FiFileText, FiTag, FiMail, FiGlobe, FiImage, FiLayers, FiCpu, FiShare2, FiStar,FiGitBranch } from 'react-icons/fi'

const links = [
  { to: '/admin', label: 'Dashboard', icon: FiHome },
  { to: '/admin/users', label: 'Users', icon: FiUsers },
  { to: '/admin/products', label: 'Products', icon: FiBox },
  { to: '/admin/orders', label: 'Orders', icon: FiShoppingCart },
  { to: '/admin/materials', label: 'Materials', icon: FiLayers },
  { to: '/admin/reviews', label: 'Reviews', icon: FiStar },
  { to: '/admin/courses', label: 'Courses', icon: FiFileText },
  { to: '/admin/categories', label: 'Categories', icon: FiTag },
  { to: '/admin/banners', label: 'Banners', icon: FiImage },
  { to: '/admin/cms', label: 'CMS Pages', icon: FiFileText },
  { to: '/admin/forms', label: 'Forms', icon: FiMail },
  { to: '/admin/garden-suggestions', label: 'Garden Suggestions', icon: FiMail }, 
  { to: '/admin/garden-posts', label: 'Garden Posts', icon: FiGitBranch },
  { to: '/admin/coupons', label: 'Coupons', icon: FiTag },
  { to: '/admin/manage-admins', label: 'Manage Admins', icon: FiUsers },
  { to: '/admin/subscribers', label: 'Subscribers', icon: FiMail },
  { to: '/admin/embeds', label: 'AI / H5P Manager', icon: FiCpu },
  { to: '/admin/pinterest', label: 'Pinterest Manager', icon: FiShare2 },
  { to: '/admin/testimonials', label: 'Testimonials', icon: FiMail },
  { to: '/admin/comments', label: 'Comments', icon: FiMail },
  { to: '/admin/teachers', label: 'Teachers', icon: FiUsers },
  { to: '/admin/picks', label: "Ele's Picks", icon: FiStar },
]

export default function AdminSidebar({ open, onClose }) {
  return (
    <aside className={`fixed z-40 inset-y-0 left-0 w-64 bg-white border-r border-gray-200 shadow-sm transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="h-16 flex items-center px-4 font-semibold text-gray-800 border-b sticky top-0 bg-white z-10">Casa De ELE | Admin Panel</div>
      <nav className="px-2 py-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent max-h-[calc(100vh-4rem)]">
        {links.map(link => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `group flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-150 ${isActive ? 'bg-red-700 text-white' : 'text-gray-700 hover:bg-red-50 hover:text-red-800'}`}
              onClick={onClose}
              end={link.to === '/admin'}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`shrink-0 transition-colors duration-150 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-red-800'}`} />
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


