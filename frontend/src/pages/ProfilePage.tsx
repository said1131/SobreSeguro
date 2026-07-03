import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { getStoredUser, saveStoredUser, signOutUser } from '../data/userStorage'
import { apiClient } from '../services/api'
import { User, Mail, Lock, LogOut } from 'lucide-react'

export function ProfilePage() {
  const user = getStoredUser()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    password: '',
    newPassword: '',
    confirmPassword: '',
  })

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

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault()

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('El nombre y apellido son requeridos')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
      }

      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setError('Las contraseñas no coinciden')
          setLoading(false)
          return
        }
        if (formData.newPassword.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres')
          setLoading(false)
          return
        }
        updateData.password = formData.newPassword
      }

      const result = await apiClient.auth.actualizarPerfil(
        updateData
      )

      if (result.error) {
        setError(result.error)
      } else {
        saveStoredUser({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.newPassword || formData.password,
        })

        setSuccess('✓ Perfil actualizado correctamente')
        setFormData({
          ...formData,
          password: '',
          newPassword: '',
          confirmPassword: '',
        })
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Error al actualizar perfil')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <AppLayout title="Perfil">
        <div className="text-center text-gray-400 py-12">
          Por favor inicia sesión
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Perfil">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda - Formulario (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del Usuario */}
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <User size={24} className="text-amber-400" />
              Información Personal
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Nombre */}
              <div>
                <label className="block text-gray-300 font-semibold mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
                />
              </div>

              {/* Apellido */}
              <div>
                <label className="block text-gray-300 font-semibold mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-gray-300 font-semibold mb-2 flex items-center gap-2">
                  <Mail size={18} />
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-gray-400 rounded-lg cursor-not-allowed"
                />
                <p className="text-gray-400 text-xs mt-1">No se puede cambiar</p>
              </div>

              {/* Sección de Contraseña */}
              <div className="border-t border-gray-700 pt-6">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Lock size={18} className="text-amber-400" />
                  Cambiar Contraseña (Opcional)
                </h4>

                <div>
                  <label className="block text-gray-300 font-semibold mb-2">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    placeholder="Dejar en blanco para no cambiar"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-2 mt-4">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirmar nueva contraseña"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Mensajes */}
              {error && (
                <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-900/30 border border-green-700 text-green-200 px-4 py-3 rounded-lg">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 text-white font-bold rounded-lg transition"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        </div>

        {/* Columna Derecha - Información de Cuenta (1/3) */}
        <div className="lg:col-span-1 space-y-6 h-fit">
          {/* Panel de Información de Cuenta */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 sticky top-6">
            <h4 className="text-white font-semibold mb-4">Información de la Cuenta</h4>
            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-400">Nombre Completo</span>
                <span className="text-white font-semibold">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-400">Correo</span>
                <span className="text-white font-semibold text-xs">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400">Estado</span>
                <span className="px-3 py-1 bg-green-900/50 text-green-200 rounded-full text-xs font-semibold">
                  Activo
                </span>
              </div>
            </div>

            {/* Botón Cerrar Sesión */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-200 font-semibold"
            >
              <LogOut size={20} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
