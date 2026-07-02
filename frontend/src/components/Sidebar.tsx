import { useMemo } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { getStoredUser } from '../data/userStorage'

const navItems = [
  { to: '/sobres', label: 'Sobres' },
  { to: '/ingreso', label: 'Ingreso' },
  { to: '/retiro', label: 'Retiro' },
  { to: '/ahorro', label: 'Ahorro' },
]

export function Sidebar() {
  const sidebarUser = useMemo(() => getStoredUser(), [])

  return (
    <aside className="bg-gray-900 text-white md:min-h-screen md:w-56">
      <Link to="/perfil" className="block border-b border-gray-700 p-5 text-center hover:bg-gray-800">
        <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full border border-white text-4xl">
          👤
        </div>
        <p>{sidebarUser.firstName.split(' ')[0]}</p>
      </Link>

      <nav className="flex flex-col">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `border-b border-gray-700 px-5 py-4 text-lg hover:bg-gray-800 ${
                isActive ? 'bg-gray-700' : ''
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Link to="/login" className="m-4 block rounded-md border border-gray-500 px-4 py-2 text-center hover:bg-gray-800">
        Cerrar sesion
      </Link>
    </aside>
  )
}
