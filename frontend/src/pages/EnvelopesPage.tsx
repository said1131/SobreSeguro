import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
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
  const [editingSobre, setEditingSobre] = useState<Sobre | null>(null)
  const [editFormData, setEditFormData] = useState({ nombre: '', porcentaje: '' })

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

      if (response.mensaje && (response.mensaje.toLowerCase().includes('excedido') || response.error)) {
        setError(response.mensaje)
        return
      }

      if (response.error) {
        setError(response.error)
        return
      }

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

  async function handleDelete(id: number, saldo: number) {
    if (saldo > 0) {
      setError('No puedes eliminar un sobre que todavía tiene saldo.')
      return
    }

    if (!confirm('¿Estás seguro?')) return

    try {
      await apiClient.sobres.eliminar(id)
      await fetchSobres()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
      console.error(err)
    }
  }

  function openEditModal(sobre: Sobre) {
    setEditingSobre(sobre)
    setEditFormData({
      nombre: sobre.nombre,
      porcentaje: String(sobre.porcentaje),
    })
    setError('')
  }

  function closeEditModal() {
    setEditingSobre(null)
    setEditFormData({ nombre: '', porcentaje: '' })
  }

  async function handleUpdate() {
    if (!editingSobre) return

    if (!editFormData.nombre.trim() || !editFormData.porcentaje) {
      setError('Completa todos los campos para editar el sobre')
      return
    }

    try {
      await apiClient.sobres.actualizarSobre(editingSobre.id, {
        nombre: editFormData.nombre.trim(),
        porcentaje: parseInt(editFormData.porcentaje),
      })
      closeEditModal()
      setError('')
      await fetchSobres()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar sobre')
      console.error(err)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Mis Sobres">
        <div className="py-12 text-center text-gray-400">Cargando sobres...</div>
      </AppLayout>
    )
  }

  const otrosSobres = sobres.filter(s => !s.esAhorro && s.activo)
  const ahorroSobre = sobres.find(s => s.esAhorro)

  return (
    <AppLayout title="Mis Sobres">
      <div className="space-y-6">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">Tus sobres</h1>
          <p className="text-gray-400">Gestiona y visualiza todos tus sobres de ahorro</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {otrosSobres.map((sobre) => (
            <div
              key={sobre.id}
              className="group cursor-pointer rounded-xl border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 p-6 transition hover:border-amber-500"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img src={iconoSobre} alt="Sobre" className="h-12 w-12 object-contain" />
                  <div>
                    <h3 className="text-lg font-bold text-white">{sobre.nombre}</h3>
                    <p className="font-semibold text-amber-400">{sobre.porcentaje}%</p>
                  </div>
                </div>

                <div className="flex gap-2 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => openEditModal(sobre)}
                    className="p-1 text-gray-400 transition hover:text-amber-400"
                    title="Editar sobre"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(sobre.id, sobre.saldo)}
                    disabled={sobre.saldo > 0}
                    className="p-1 text-gray-400 transition hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                    title={sobre.saldo > 0 ? 'No se puede eliminar con saldo' : 'Eliminar sobre'}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <p className="mb-1 text-sm text-gray-400">Saldo actual</p>
                <p className="text-2xl font-bold text-amber-400">
                  ${sobre.saldo.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (sobre.saldo / 1000) * 100)}%` }}
                ></div>
              </div>
            </div>
          ))}

          {ahorroSobre && (
            <div className="rounded-xl border border-amber-700 bg-gradient-to-br from-amber-900 to-amber-950 p-6 transition hover:border-amber-400">
              <div className="mb-4 flex items-center gap-3">
                <img src={iconoSobre} alt="Sobre Ahorro" className="h-12 w-12 object-contain" />
                <div>
                  <h3 className="text-lg font-bold text-white">{ahorroSobre.nombre}</h3>
                  <p className="font-semibold text-amber-300">{ahorroSobre.porcentaje}%</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="mb-1 text-sm text-amber-200">Ahorrado total</p>
                <p className="text-2xl font-bold text-amber-300">
                  ${ahorroSobre.saldo.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-amber-950">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-300"
                  style={{ width: `${Math.min(100, (ahorroSobre.saldo / 5000) * 100)}%` }}
                ></div>
              </div>
            </div>
          )}

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-600 bg-gray-800 p-6 transition hover:border-amber-500"
            >
              <Plus size={40} className="text-gray-500 transition group-hover:text-amber-500" />
              <span className="font-semibold text-gray-400 transition group-hover:text-white">Agregar sobre</span>
            </button>
          )}
        </div>

        {showForm && (
          <div className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6">
            <h3 className="text-lg font-bold text-white">Crear nuevo sobre</h3>

            {(() => {
              const ahorroSobre = sobres.find(s => s.esAhorro)
              const otrosSobres = sobres.filter(s => !s.esAhorro && s.activo && !s.nombre.toLowerCase().includes('residuo'))
              const porcentajeUsado = otrosSobres.reduce((sum, s) => sum + s.porcentaje, 0)
              const porcentajeDisponible = 100 - (ahorroSobre?.porcentaje || 0) - porcentajeUsado

              return (
                <div className="rounded-lg bg-gray-700/50 p-3 text-sm">
                  <p className="text-gray-300">
                    Ahorro: <span className="font-semibold text-amber-400">{ahorroSobre?.porcentaje || 0}%</span>
                  </p>
                  <p className="text-gray-300">
                    Otros sobres: <span className="font-semibold text-amber-400">{porcentajeUsado}%</span>
                  </p>
                  <p className="mt-2 font-semibold text-gray-200">
                    Disponible: <span className="text-green-400">{porcentajeDisponible}%</span>
                  </p>
                </div>
              )
            })()}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Nombre del sobre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-amber-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Porcentaje (%)"
                value={formData.porcentaje}
                onChange={(e) => setFormData({ ...formData, porcentaje: e.target.value })}
                className="rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-semibold text-white transition hover:bg-amber-600"
              >
                Crear
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-lg bg-gray-700 px-4 py-2 font-semibold text-white transition hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {editingSobre && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-xl">
              <h3 className="mb-4 text-xl font-bold text-white">Editar sobre</h3>
              <p className="mb-4 text-sm text-gray-400">
                Cambia el nombre del sobre o el porcentaje asignado.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block font-semibold text-gray-300">
                    Nombre del sobre
                  </label>
                  <input
                    type="text"
                    value={editFormData.nombre}
                    onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-semibold text-gray-300">
                    Porcentaje (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editFormData.porcentaje}
                    onChange={(e) => setEditFormData({ ...editFormData, porcentaje: e.target.value })}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleUpdate}
                  className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-semibold text-white transition hover:bg-amber-600"
                >
                  Guardar
                </button>
                <button
                  onClick={closeEditModal}
                  className="flex-1 rounded-lg bg-gray-700 px-4 py-2 font-semibold text-white transition hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
