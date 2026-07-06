import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiClient } from '../services/api'
import logo from '../assets/logo.png'

export function RecuperarPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '')

    try {
      const result = await apiClient.auth.solicitarRecuperacion(email)
      
      if (result.codigo) {
        setSuccess('Código enviado. Verifica tu email.')
        setTimeout(() => {
          navigate('/cambiar-contrasena', { state: { email, codigo: result.codigo } })
        }, 2000)
      } else {
        setError(result.mensaje || 'Error al solicitar recuperación')
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
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center p-8" style={{backgroundColor: '#2d160b'}}>
        <img src={logo} alt="Logo" className="w-32 object-contain mb-4" />
        <h1 className="text-5xl font-black text-white mb-4 text-center">SobreSeguro</h1>
        <p className="text-amber-100 text-center text-lg">
          Recupera el acceso a tu cuenta
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

          <h2 className="text-3xl font-bold text-white mb-2 text-center">Recuperar Contraseña</h2>
          <p className="text-gray-400 text-center mb-8">Ingresa tu email para recibir un código</p>

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

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 text-white font-bold rounded-lg transition duration-200 text-lg"
            >
              {loading ? 'Enviando código...' : 'Enviar Código'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-8 space-y-4 text-center">
            <Link
              to="/login"
              className="block text-amber-400 hover:text-amber-300 font-semibold transition"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
