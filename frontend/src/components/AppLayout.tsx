import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, Home, Inbox, DollarSign, TrendingDown, PiggyBank, User, ChevronDown } from 'lucide-react'
import { signOutUser, getStoredUser } from '../data/userStorage'
import { apiClient } from '../services/api'
import logo from '../assets/logo.png'
import cerdito from '../assets/Cerdito.png'

type AppLayoutProps = {
  title: string
  children: React.ReactNode
}

// Arreglo de frases chistosas y motivacionales para el cerdito
const FRASES_CERDITO = [
  "¡Oink! Ese saldo se ve hermoso hoy... no lo vayas a gastar en skins de juegos. 🎮",
  "¿De verdad necesitas comprar eso o solo es un vacío emocional? Pregunto de compas. 🫣",
  "Cada peso que ahorras es un paso más lejos de vivir debajo de un puente. ¡Ánimo! 🌉",
  "¡No me rompas! De verdad, soy digital, no tengo monedas adentro. 🚫🔨",
  "¡Oink! Recuerda: el residuo no es dinero gratis para pedir comida a domicilio. 🍕",
  "Tu 'yo' del futuro te va a agradecer este ahorro. O se lo va a gastar en otra cosa, pero tú cumple. 🧠",
  "¿Bloqueaste un sobre de ahorro? Excelente. Mantén tus manos lejos de ahí. 🔒🐷",
  "¡Ssssshh! Escucho cómo tus ahorros van creciendo. Suena a éxito. 💸",
  "Ahorrar es como ir al gym: da flojera al principio, pero luego te gusta ver los resultados. 💪",
  "Si sigues así, pronto el millonario de la familia vas a ser tú. 😎"
]

export function AppLayout({ title, children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [userInfo, setUserInfo] = useState<{firstName: string; lastName: string; email: string} | null>(null)
  
  // Estados para controlar el globo de texto del cerdito
  const [consejo, setConsejo] = useState("")
  const [showTooltip, setShowTooltip] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const user = getStoredUser()
    if (user) {
      setUserInfo(user)
    }
  }, [])

  // Limpiar el temporizador al salir de la pantalla para evitar fugas de memoria
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await apiClient.auth.logout()
    } catch (err) {
      console.error('Error en logout:', err)
    } finally {
      signOutUser()
      navigate('/login')
    }
  }

  // Función para seleccionar una frase aleatoria sin repetir la anterior al dar clic
  const hablarCerdito = () => {
    let nuevaFrase = consejo
    while (nuevaFrase === consejo) {
      nuevaFrase = FRASES_CERDITO[Math.floor(Math.random() * FRASES_CERDITO.length)]
    }
    
    setConsejo(nuevaFrase)
    setShowTooltip(true)

    // Ocultar el globo de diálogo después de 8 segundos
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(false)
    }, 5000)
  }

  const navItems = [
    { label: 'Inicio', path: '/inicio', icon: Home },
    { label: 'Sobres', path: '/sobres', icon: Inbox },
    { label: 'Ingresos', path: '/ingreso', icon: DollarSign },
    { label: 'Retiros', path: '/retiro', icon: TrendingDown },
    { label: 'Ahorro', path: '/ahorro', icon: PiggyBank },
  ]

  return (
    <div className="h-screen bg-gray-900 flex overflow-hidden">
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
        {/* Logo moderno en una sola línea */}
<div className="p-6 flex items-center justify-center gap-3 border-b border-amber-950/20">
  <img src={logo} alt="Logo" className="w-11 h-11 object-contain" />
  <h2 className="text-white font-extrabold text-xl tracking-tight bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
    SobreSeguro
  </h2>
</div>

        {/* Navegación */}
        <nav className="p-6 space-y-4 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  setSidebarOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-lg text-white transition duration-200 font-semibold flex items-center gap-3 ${
                  isActive ? 'border-l-4 border-amber-400' : ''
                }`}
                style={{
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#5a3f2f' : 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4a2f1f'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isActive ? '#5a3f2f' : 'transparent'}
              >
                <Icon size={20} />
                {item.label}
              </button>
            )
          })}

          {/* Cerdito Interactivo con Tooltip Flotante */}
          <div className="pt-4 border-t border-amber-900/40 flex flex-col items-center relative">
            {showTooltip && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 w-52 bg-amber-500 text-gray-950 text-xs font-semibold p-3 rounded-xl shadow-2xl border border-amber-400 text-center">
                {/* Flecha del globo apuntando hacia abajo */}
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-amber-500 rotate-45 border-r border-b border-amber-400"></div>
                <p className="relative z-10 leading-snug">{consejo}</p>
              </div>
            )}

            <button
              onClick={hablarCerdito}
              className="transition-transform active:scale-95 hover:scale-105 focus:outline-none"
              style={{ cursor: 'pointer' }}
              title="¡Hazme clic!"
            >
              <img src={cerdito} alt="Cerdito" className="w-24 h-24 object-contain filter drop-shadow-[0_4px_6px_rgba(245,158,11,0.2)]" />
            </button>
            <span className="text-[10px] text-amber-400/80 font-bold mt-1 tracking-wider uppercase animate-pulse">¡Tócame! 🐷</span>
          </div>
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
      <main className="flex-1 flex flex-col overflow-hidden">
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