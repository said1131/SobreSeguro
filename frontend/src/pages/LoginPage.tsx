import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { saveStoredUser } from '../data/userStorage'
import { apiClient } from '../services/api'
import logo from '../assets/logo.png'

export function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')

    try {
      const result = await apiClient.auth.login(email, password)
      
      if (result.usuario) {
        saveStoredUser({
          firstName: result.usuario.firstName,
          lastName: result.usuario.lastName,
          email: result.usuario.email,
          password: password,
        })
        navigate('/inicio')
      } else {
        setError(result.mensaje || 'Error en el login')
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Panel Izquierdo Marrón */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center p-8" style={{backgroundColor: '#2d160b'}}>
         <img src={logo} alt="Logo" className="w-32 object-contain mb-4" />
        <h1 className="text-5xl font-black text-white mb-4 text-center">SobreSeguro</h1>
        <p className="text-amber-100 text-center text-lg">
          Ahorra sin esfuerzo, un sobre a la vez
        </p>
      </div>

      {/* Formulario */}
       <div className="w-full lg:w-1/2 bg-gray-800 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="lg:hidden text-center mb-8">
            <img src={logo} alt="Logo" className="w-20 h-20 mx-auto mb-4 rounded-lg" />
            <h1 className="text-4xl font-black text-white mb-2">SobreSeguro</h1>
          </div>

          <h2 className="text-3xl font-bold text-white mb-8 text-center">Iniciar Sesión</h2>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label className="block text-gray-300 font-semibold mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                placeholder="tu@email.com"
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-gray-300 font-semibold mb-2">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
              />
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 text-white font-bold rounded-lg transition duration-200 text-lg"
            >
              {loading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-8 space-y-4">
            <Link
              to="/recuperar"
              className="block text-center text-amber-400 hover:text-amber-300 font-semibold transition"
            >
              ¿Olvidaste tu contraseña?
            </Link>
            
            <div className="text-center">
              <span className="text-gray-400">¿No tienes cuenta? </span>
              <Link
                to="/registro"
                className="text-amber-400 hover:text-amber-300 font-semibold transition"
              >
                Regístrate aquí
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
