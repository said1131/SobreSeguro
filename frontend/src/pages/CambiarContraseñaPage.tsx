import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { apiClient } from '../services/api'
import logo from '../assets/logo.png'

export function CambiarContraseñaPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [email, setEmail] = useState(location.state?.email || '')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const formData = new FormData(event.currentTarget)
    const codigo = String(formData.get('codigo') ?? '')
    const nuevaContrasena = String(formData.get('nuevaContrasena') ?? '')
    const confirmPassword = String(formData.get('confirmPassword') ?? '')

    try {
      const result = await apiClient.auth.cambiarContrasena({
        email,
        codigo,
        nuevaContrasena,
        confirmPassword,
      })
      
      if (result.usuario) {
        setSuccess('Contraseña cambiada exitosamente. Redirigiendo...')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError(result.mensaje || 'Error al cambiar contraseña')
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Panel Izquierdo */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center p-8" style={{backgroundColor: '#3d2817'}}>
        <img src={logo} alt="Logo" className="w-32 h-32 mb-8 rounded-lg" />
        <h1 className="text-5xl font-black text-white mb-4 text-center">SobreSeguro</h1>
        <p className="text-amber-100 text-center text-lg">
          Verifica tu código y crea una nueva contraseña
        </p>
      </div>

      {/* Formulario */}
      <div className="w-full lg:w-1/2 bg-gray-800 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="lg:hidden text-center mb-8">
            <img src={logo} alt="Logo" className="w-20 h-20 mx-auto mb-4 rounded-lg" />
            <h1 className="text-3xl font-black text-white">SobreSeguro</h1>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2 text-center">Cambiar Contraseña</h2>
          <p className="text-gray-400 text-center mb-8">Completa el formulario para resetear tu contraseña</p>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900 border border-green-700 text-green-100 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email (solo lectura) */}
            <div>
              <label className="block text-gray-300 font-semibold mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-400 rounded-lg opacity-50"
              />
            </div>

            {/* Código */}
            <div>
              <label className="block text-gray-300 font-semibold mb-2">
                Código de Verificación (6 dígitos)
              </label>
              <input
                type="text"
                name="codigo"
                placeholder="000000"
                maxLength={6}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 text-center text-2xl tracking-widest"
              />
              <p className="text-gray-400 text-sm mt-2">Revisa tu email para obtener el código</p>
            </div>

            {/* Nueva Contraseña */}
            <div>
              <label className="block text-gray-300 font-semibold mb-2">
                Nueva Contraseña
              </label>
              <input
                type="password"
                name="nuevaContrasena"
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
              />
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label className="block text-gray-300 font-semibold mb-2">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                name="confirmPassword"
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
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 text-white font-bold rounded-lg transition duration-200 text-lg mt-8"
            >
              {loading ? 'Procesando...' : 'Cambiar Contraseña'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="text-amber-400 hover:text-amber-300 font-semibold transition"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
