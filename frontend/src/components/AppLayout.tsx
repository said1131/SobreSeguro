import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, Home, Inbox, DollarSign, TrendingDown, PiggyBank, User, ChevronDown } from 'lucide-react'
import { signOutUser, getStoredUser } from '../data/userStorage'
import { apiClient } from '../services/api'
import logo from '../assets/logo.png'

type AppLayoutProps = {
  title: string
  children: React.ReactNode
}

export function AppLayout({ title, children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [userInfo, setUserInfo] = useState<{firstName: string; lastName: string; email: string} | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Obtener información del usuario
    const user = getStoredUser()
    if (user) {
      setUserInfo(user)
    }
  }, [])

  const handleLogout = async () => {
    try {
      // Llamar al endpoint de logout del backend
      await apiClient.auth.logout()
    } catch (err) {
      console.error('Error en logout:', err)
    } finally {
      // Siempre limpiar localStorage y navegar
      signOutUser()
      navigate('/login')
    }
  }

  const navItems = [
    { label: 'Inicio', path: '/inicio', icon: Home },
    { label: 'Sobres', path: '/sobres', icon: Inbox },
    { label: 'Ingresos', path: '/ingreso', icon: DollarSign },
    { label: 'Retiros', path: '/retiro', icon: TrendingDown },
    { label: 'Ahorro', path: '/ahorro', icon: PiggyBank },
  ]

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside className={`fixed z-40 h-screen w-64 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`} style={{backgroundColor: '#3d2817'}}>
        {/* Cerrar en móvil */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 lg:hidden text-white"
        >
          <X size={24} />
        </button>

        {/* Logo */}
        <div className="p-6 border-b" style={{borderColor: '#2a1810'}}>
          <img src={logo} alt="Logo" className="w-12 h-12 rounded-lg mx-auto mb-2" />
          <h2 className="text-white font-bold text-center text-lg">SobreSeguro</h2>
        </div>

        {/* Navegación */}
        <nav className="p-6 space-y-4 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  setSidebarOpen(false)
                }}
                className="w-full text-left px-4 py-3 rounded-lg text-white transition duration-200 font-semibold flex items-center gap-3"
                style={{cursor: 'pointer'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4a2f1f'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Icon size={20} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Panel de Perfil de Usuario */}
        <div className="border-t p-4" style={{borderColor: '#2a1810'}}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full px-4 py-3 rounded-lg text-white transition duration-200 font-semibold flex items-center justify-between"
            style={{backgroundColor: '#4a2f1f', cursor: 'pointer'}}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a3f2f'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4a2f1f'}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{userInfo?.firstName || 'Usuario'}</p>
                <p className="text-xs text-gray-300">{userInfo?.email || 'email@example.com'}</p>
              </div>
            </div>
            <ChevronDown size={18} className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Menu desplegable del perfil */}
          {profileOpen && (
            <div className="mt-3 space-y-2 animate-in">
              <button
                onClick={() => {
                  navigate('/perfil')
                  setSidebarOpen(false)
                  setProfileOpen(false)
                }}
                className="w-full text-left px-4 py-2 rounded-lg text-white transition duration-200 text-sm"
                style={{backgroundColor: '#3d2817'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a1810'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3d2817'}
              >
                Ver Perfil
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-start gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-200 text-sm font-semibold"
              >
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-white hover:text-amber-400 transition"
            >
              <Menu size={28} />
            </button>
            <h1 className="text-3xl font-bold text-white">{title}</h1>
          </div>
        </header>

        {/* Contenido */}
        <section className="flex-1 overflow-auto p-6">
          <div className="w-full max-w-6xl mx-auto">
            {children}
          </div>
        </section>
      </main>
    </div>
  )
}

