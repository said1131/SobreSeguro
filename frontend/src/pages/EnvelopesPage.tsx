import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { apiClient } from '../services/api'
import iconoSobre from '../assets/icono-sobre.png'

interface Sobre {
  id: number
  nombre: string
  porcentaje: number
  saldo: number
  esAhorro: boolean
  activo: boolean
}

export function EnvelopesPage() {
  const [sobres, setSobres] = useState<Sobre[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ nombre: '', porcentaje: '' })

  useEffect(() => {
    fetchSobres()
  }, [])

  async function fetchSobres() {
    try {
      setLoading(true)
      const result = await apiClient.sobres.obtener()
      setSobres(result || [])
    } catch (err) {
      setError('Error al obtener los sobres')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!formData.nombre.trim() || !formData.porcentaje) {
      setError('Completa todos los campos')
      return
    }

    try {
      const response = await apiClient.sobres.crear({
        nombre: formData.nombre,
        porcentaje: parseInt(formData.porcentaje),
      })

      // Si viene en formato de error con 'mensaje'
      if (response.mensaje && (response.mensaje.toLowerCase().includes('excedido') || response.error)) {
        setError(response.mensaje)
        return
      }

      // Si el servidor retorna status de error
      if (response.error) {
        setError(response.error)
        return
      }

      // Si fue exitoso
      if (response.sobre || response.status === 201) {
        setFormData({ nombre: '', porcentaje: '' })
        setShowForm(false)
        setError('')
        await fetchSobres()
      }
    } catch (err) {
      console.error('Error al crear sobre:', err)
      setError('Error al crear sobre: ' + (err instanceof Error ? err.message : 'Error desconocido'))
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Estás seguro?')) return

    try {
      await apiClient.sobres.eliminar(id)
      await fetchSobres()
    } catch (err) {
      setError('Error al eliminar')
      console.error(err)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Mis Sobres">
        <div className="text-center text-gray-400 py-12">Cargando sobres...</div>
      </AppLayout>
    )
  }

  const otrosSobres = sobres.filter(s => !s.esAhorro && s.activo)
  const ahorroSobre = sobres.find(s => s.esAhorro)

  return (
    <AppLayout title="Mis Sobres">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Tus sobres</h1>
          <p className="text-gray-400">Gestiona y visualiza todos tus sobres de ahorro</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Grid de Sobres */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {otrosSobres.map((sobre) => (
            <div
              key={sobre.id}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-amber-500 transition group cursor-pointer"
            >
              {/* Encabezado con ícono y botón eliminar */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <img src={iconoSobre} alt="Sobre" className="w-12 h-12 object-contain" />
                  <div>
                    <h3 className="text-white font-bold text-lg">{sobre.nombre}</h3>
                    <p className="text-amber-400 font-semibold">{sobre.porcentaje}%</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(sobre.id)}
                  className="text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100 p-1"
                  title="Eliminar sobre"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Saldo */}
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-1">Saldo actual</p>
                <p className="text-2xl font-bold text-amber-400">${sobre.saldo.toLocaleString('es-ES', { maximumFractionDigits: 2 })}</p>
              </div>

              {/* Barra de progreso */}
              <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (sobre.saldo / 1000) * 100)}%` }}
                ></div>
              </div>
            </div>
          ))}

          {/* Sobre de Ahorro */}
          {ahorroSobre && (
            <div className="bg-gradient-to-br from-amber-900 to-amber-950 rounded-xl p-6 border border-amber-700 hover:border-amber-400 transition">
              <div className="flex items-center gap-3 mb-4">
                <img src={iconoSobre} alt="Sobre Ahorro" className="w-12 h-12 object-contain" />
                <div>
                  <h3 className="text-white font-bold text-lg">{ahorroSobre.nombre}</h3>
                  <p className="text-amber-300 font-semibold">{ahorroSobre.porcentaje}%</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-amber-200 text-sm mb-1">Ahorrado total</p>
                <p className="text-2xl font-bold text-amber-300">${ahorroSobre.saldo.toLocaleString('es-ES', { maximumFractionDigits: 2 })}</p>
              </div>

              <div className="bg-amber-950 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-300"
                  style={{ width: `${Math.min(100, (ahorroSobre.saldo / 5000) * 100)}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Botón Agregar Sobre */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-gray-800 rounded-xl p-6 border-2 border-dashed border-gray-600 hover:border-amber-500 transition flex flex-col items-center justify-center gap-3 group"
            >
              <Plus size={40} className="text-gray-500 group-hover:text-amber-500 transition" />
              <span className="text-gray-400 group-hover:text-white transition font-semibold">Agregar sobre</span>
            </button>
          )}
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
            <h3 className="text-white font-bold text-lg">Crear nuevo sobre</h3>
            
            {/* Info de porcentajes disponibles */}
            {(() => {
              const ahorroSobre = sobres.find(s => s.esAhorro)
              const otrosSobres = sobres.filter(s => !s.esAhorro && s.activo)
              const porcentajeUsado = otrosSobres.reduce((sum, s) => sum + s.porcentaje, 0)
              const porcentajeDisponible = 100 - (ahorroSobre?.porcentaje || 0) - porcentajeUsado
              
              return (
                <div className="bg-gray-700/50 p-3 rounded-lg text-sm">
                  <p className="text-gray-300">
                    Ahorro: <span className="text-amber-400 font-semibold">{ahorroSobre?.porcentaje || 0}%</span>
                  </p>
                  <p className="text-gray-300">
                    Otros sobres: <span className="text-amber-400 font-semibold">{porcentajeUsado}%</span>
                  </p>
                  <p className="text-gray-200 font-semibold mt-2">
                    Disponible: <span className="text-green-400">{porcentajeDisponible}%</span>
                  </p>
                </div>
              )
            })()}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre del sobre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-amber-500"
              />
              <input
                type="number"
                placeholder="Porcentaje (%)"
                value={formData.porcentaje}
                onChange={(e) => setFormData({ ...formData, porcentaje: e.target.value })}
                className="px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition font-semibold"
              >
                Crear
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
