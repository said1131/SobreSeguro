import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { ArrowRightLeft, Coins, History, AlertTriangle } from 'lucide-react'
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
  monto: number
  sobreNombre: string
  fecha: string
}

export function WithdrawPage() {
  const [sobres, setSobres] = useState<Sobre[]>([])
  const [retiros, setRetiros] = useState<Retiro[]>([])
  const [sobreSeleccionado, setSobreSeleccionado] = useState<number | ''>('')
  const [monto, setMonto] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Nuevo estado para controlar el Modal de Confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const sobresData = await apiClient.sobres.obtener()
      setSobres(sobresData?.filter((s: Sobre) => s.activo) || [])
      
      const retirosData = await apiClient.retiros.obtenerRetiros()
      setRetiros(retirosData || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo conectar con el servidor.'
      setError(message)
      console.error(err)
    }
  }

  // 1. Primer paso: Validar datos y abrir el Modal de Confirmación
  function handleTriggerConfirm(e: FormEvent) {
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

    setError('')
    setShowConfirmModal(true) // Abre el modal de confirmación
  }

  // 2. Segundo paso: Ejecutar el retiro real tras confirmar en el modal
  async function handleExecuteWithdraw() {
    setShowConfirmModal(false) // Cerrar modal enseguida
    const sobre = sobres.find((s) => s.id === sobreSeleccionado)
    if (!sobre) return

    try {
      setLoading(true)
      setError('')
      setSuccess('')
      
      await apiClient.retiros.realizarRetiro(Number(sobreSeleccionado), Number(monto))
      
      setSuccess(`✓ Retiro de $${Number(monto).toFixed(2)} completado de ${sobre.nombre}`)
      setMonto('')
      setSobreSeleccionado('')
      
      setTimeout(() => setSuccess(''), 3000)
      await fetchData()
    } catch (err: any) {
      const errorMsg = err?.message || 'Error al realizar retiro'
      if (err?.bloqueado) {
        setError(`El sobre de ahorro está bloqueado. Faltan ${err?.diasRestantes} días para poder retirar (hasta ${new Date(err?.fechaDesbloqueo).toLocaleDateString('es-ES')})`)
      } else {
        setError(errorMsg)
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const sobreActual = sobres.find((s) => s.id === sobreSeleccionado)

  return (
    <AppLayout title="Retiros">
      <div className="grid xl:grid-cols-[1.05fr_0.95fr] gap-6 relative">
        
        {/* Formulario de Retiro */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-full bg-amber-500/20 p-3 text-amber-300">
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Retirar dinero</h3>
              <p className="text-gray-400 text-sm">Mueve tu saldo con control y claridad</p>
            </div>
          </div>

          <form onSubmit={handleTriggerConfirm} className="space-y-6">
            <div>
              <label className="block text-gray-300 font-semibold mb-2">Selecciona un sobre</label>
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

            {sobreActual && (
              <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Saldo disponible</p>
                    <p className="text-2xl font-bold text-amber-400">${sobreActual.saldo.toFixed(2)}</p>
                  </div>
                  <div className="rounded-full bg-amber-500/20 p-3 text-amber-300">
                    <Coins size={18} />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-gray-300 font-semibold mb-2">Monto a retirar</label>
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
              {loading ? 'Procesando...' : 'Retirar ahora'}
            </button>
          </form>
        </div>

        {/* Historial de retiros */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-full bg-amber-500/20 p-3 text-amber-300">
              <History size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Historial de retiros</h3>
              <p className="text-gray-400 text-sm">Tus últimos movimientos de retiro</p>
            </div>
          </div>

          {retiros.length > 0 ? (
            <div className="space-y-3">
              {retiros.slice().reverse().map((retiro) => (
                <div key={retiro.id} className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-semibold">{retiro.sobreNombre}</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(retiro.fecha).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <p className="text-red-400 font-bold">-${Number(retiro.monto).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-12">
              <div className="rounded-full bg-amber-500/20 p-6">
                <History size={40} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Sin retiros aún</h3>
                <p className="text-gray-400 text-sm mt-1">Tus retiros aparecerán aquí una vez que realices uno.</p>
              </div>
            </div>
          )}
        </div>

        {/* MODAL DE CONFIRMACIÓN */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-amber-400 mb-4">
                <AlertTriangle size={28} />
                <h4 className="text-lg font-bold text-white">¿Confirmar retiro?</h4>
              </div>
              
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                Estás a punto de retirar <span className="text-amber-400 font-bold">${Number(monto).toFixed(2)}</span> del sobre <span className="text-white font-bold">{sobreActual?.nombre}</span>. Esta acción restará dinero de tus fondos disponibles.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white font-semibold rounded-lg hover:bg-gray-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteWithdraw}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold rounded-lg transition"
                >
                  Sí, retirar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}