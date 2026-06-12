import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const nav = [
  { to: '/caja',      icon: '🛒', label: 'Caja' },
  { to: '/productos', icon: '📦', label: 'Productos' },
  { to: '/ventas',    icon: '📋', label: 'Ventas' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧾</span>
          <span className="font-bold text-lg">factura-pe</span>
          {user?.razonSocial && (
            <span className="text-blue-200 text-sm hidden sm:inline">— {user.razonSocial}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-blue-100 hidden sm:inline">{user?.nombre}</span>
          <button onClick={handleLogout} className="text-sm bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded-lg">
            Salir
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom nav (mobile POS) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
        {nav.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            <span className="text-xl">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
