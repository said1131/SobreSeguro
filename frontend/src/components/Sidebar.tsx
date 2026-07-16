import { useMemo } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { getStoredUser } from '../data/userStorage'
// 1. Importa aquí la imagen de tu cerdito. 
// Ajusta la ruta '../assets/cerdito.png' si la guardaste en otra carpeta o con otro nombre.
import cerditoImg from '../assets/cerdito.png' 

const navItems = [
  { to: '/sobres', label: 'Sobres' },
  { to: '/ingreso', label: 'Ingreso' },
  { to: '/retiro', label: 'Retiro' },
  { to: '/ahorro', label: 'Ahorro' },
]

export function Sidebar() {
  const sidebarUser = useMemo(() => getStoredUser(), [])

  return (
    <aside className="text-white md:h-screen md:w-56 flex flex-col" style={{backgroundColor: '#3d2817'}}>
      {/* Perfil del Usuario */}
      <Link to="/perfil" className="block border-b border-gray-700 p-5 text-center hover:bg-gray-800">
        <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full border border-white text-4xl">
          👤
        </div>
        <p>{sidebarUser.firstName.split(' ')[0]}</p>
      </Link>

      {/* Menú de Navegación */}
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

      {/* 2. Contenedor del Cerdito: ocupa todo el espacio vertical sobrante y lo centra */}
      <div className="flex-1 flex items-center justify-center p-4">
        <img 
          src={cerditoImg} 
          alt="Cerdito Ahorrador" 
          className="w-32 h-auto max-h-36 object-contain opacity-90 hover:scale-105 transition-transform duration-200"
        />
      </div>

      {/* Botón de Cerrar Sesión */}
      <Link to="/login" className="m-4 block rounded-md border border-gray-500 px-4 py-2 text-center hover:bg-gray-800">
        Cerrar sesion
      </Link>
    </aside>
  )
}