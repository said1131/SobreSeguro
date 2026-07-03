import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { AppLayout } from '../components/AppLayout'
import { apiClient } from '../services/api'

interface Sobre {
  id: number
  nombre: string
  porcentaje: number
  saldo: number
  esAhorro: boolean
  activo: boolean
  fechaBloqueo?: string
  tiempoBloqueoMeses?: number
}

interface Retiro {
  id: number
  sobreId: number
  monto: number
  fecha: string
  estado: string
}

export function WithdrawPage() {
  const [sobres, setSobres] = useState<Sobre[]>([])
  const [sobreSeleccionado, setSobreSeleccionado] = useState<number | ''>('')
  const [monto, setMonto] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [retiros, setRetiros] = useState<Retiro[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const sobresData = await apiClient.sobres.obtener()
      // Mostrar todos los sobres activos (incluyendo ahorro)
      setSobres(sobresData?.filter((s: Sobre) => s.activo) || [])

      const retirosData = await apiClient.retiros.obtenerRetiros()
      setRetiros(retirosData || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function handleWithdraw(e: FormEvent) {
    e.preventDefault()

    if (!sobreSeleccionado || !monto) {
      setError('Selecciona un sobre y un monto')
      return
    }

    if (isNaN(Number(monto)) || Number(monto) <= 0) {
      setError('Monto inválido')
      return
    }

    const sobre = sobres.find((s) => s.id === sobreSeleccionado)
    if (!sobre || sobre.saldo < Number(monto)) {
      setError('Saldo insuficiente')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await apiClient.retiros.realizarRetiro(
        Number(sobreSeleccionado),
        Number(monto)
      )

      setSuccess(
        `✓ Retiro de $${Number(monto).toFixed(2)} completado de ${sobre.nombre}`
      )
      setMonto('')
      setSobreSeleccionado('')
      setTimeout(() => setSuccess(''), 3000)

      // Recargar datos
      await fetchData()
    } catch (err: any) {
      const errorMsg = err?.message || 'Error al realizar retiro'
      
      // Verificar si es error de bloqueo
      if (err?.bloqueado) {
        setError(
          `El sobre de ahorro está bloqueado. Faltan ${err?.diasRestantes} días para poder retirar (hasta ${new Date(err?.fechaDesbloqueo).toLocaleDateString('es-ES')})`
        )
      } else if (errorMsg.includes('bloqueado')) {
        setError(errorMsg)
      } else {
        setError('Error al realizar retiro')
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const sobreActual = sobres.find((s) => s.id === sobreSeleccionado)

  return (
    <AppLayout title="Retiros">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Formulario */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <h3 className="text-white font-bold text-lg mb-6">Realizar Retiro</h3>

          <form onSubmit={handleWithdraw} className="space-y-6">
            {/* Seleccionar Sobre */}
            <div>
              <label className="block text-gray-300 font-semibold mb-2">
                Selecciona un Sobre
              </label>
              <select
                value={sobreSeleccionado}
                onChange={(e) => setSobreSeleccionado(Number(e.target.value) || '')}
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="">-- Selecciona un sobre --</option>
                {sobres.map((sobre) => (
                  <option key={sobre.id} value={sobre.id}>
                    {sobre.nombre} (${sobre.saldo.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Mostrar Saldo Disponible */}
            {sobreActual && (
              <div className="bg-gray-700/50 rounded p-3 border border-gray-600">
                <p className="text-gray-400 text-sm">Saldo Disponible</p>
                <p className="text-2xl font-bold text-amber-400">
                  ${sobreActual.saldo.toFixed(2)}
                </p>
              </div>
            )}

            {/* Monto */}
            <div>
              <label className="block text-gray-300 font-semibold mb-2">
                Monto a Retirar
              </label>
              <input
                type="number"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
              />
            </div>

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
              disabled={loading || !sobreSeleccionado || !monto}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 text-white font-bold rounded-lg transition"
            >
              {loading ? 'Procesando...' : 'Retirar'}
            </button>
          </form>
        </div>

        {/* Historial */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <h3 className="text-white font-bold text-lg mb-6">Historial de Retiros</h3>

          {retiros.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Sin retiros registrados</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {retiros.map((retiro) => (
                <div
                  key={retiro.id}
                  className="bg-gray-700/50 rounded p-4 border border-gray-600 hover:border-amber-500 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-white font-semibold">${retiro.monto.toFixed(2)}</p>
                    <span className="text-xs px-2 py-1 bg-green-900/50 text-green-200 rounded">
                      {retiro.estado}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {new Date(retiro.fecha).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
