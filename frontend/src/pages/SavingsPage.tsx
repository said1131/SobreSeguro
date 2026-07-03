import { useState, useEffect } from 'react'
import { TrendingUp, Zap } from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { apiClient } from '../services/api'

interface Sobre {
  id: number
  nombre: string
  porcentaje: number
  saldo: number
  esAhorro: boolean
  activo: boolean
  esAutomatico?: boolean
  montoAutomatico?: number
  frecuenciaAutomatica?: string
  fechaBloqueo?: string | Date
  tiempoBloqueoMeses?: number
}

export function SavingsPage() {
  const [ahorro, setAhorro] = useState<Sobre | null>(null)
  const [loading, setLoading] = useState(true)
  const [porcentaje, setPorcentaje] = useState('')
  const [tiempoBloqueoMeses, setTiempoBloqueoMeses] = useState('12')
  const [configurando, setConfigurando] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchAhorro()
  }, [])

  async function fetchAhorro() {
    try {
      setLoading(true)
      const result = await apiClient.sobres.obtener()
      const ahorroSobre = result?.find((s: Sobre) => s.esAhorro)
      setAhorro(ahorroSobre || null)
      if (ahorroSobre) {
        setPorcentaje(ahorroSobre.porcentaje.toString())
      }
    } catch (err) {
      setError('Error al cargar ahorro')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleConfigurAhorro() {
    if (!porcentaje || isNaN(Number(porcentaje)) || Number(porcentaje) <= 0) {
      setError('Ingresa un porcentaje válido')
      return
    }

    if (!tiempoBloqueoMeses || isNaN(Number(tiempoBloqueoMeses)) || Number(tiempoBloqueoMeses) <= 0) {
      setError('Ingresa un tiempo de bloqueo válido')
      return
    }

    try {
      setConfigurando(true)
      setError('')
      setSuccess('')

      const result = await apiClient.sobres.configurarAhorro(Number(porcentaje), Number(tiempoBloqueoMeses))

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(`✓ Ahorro configurado a ${porcentaje}% con bloqueo de ${tiempoBloqueoMeses} meses`)
        setTimeout(() => setSuccess(''), 3000)
        await fetchAhorro()
      }
    } catch (err) {
      setError('Error al configurar ahorro')
      console.error(err)
    } finally {
      setConfigurando(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Sobre de Ahorro">
        <div className="text-center text-gray-400 py-12">Cargando...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Sobre de Ahorro">
      <div className="space-y-6 max-w-2xl">
        {/* Card Principal */}
        {ahorro && (
          <div className="bg-gradient-to-br from-amber-900 to-amber-800 rounded-lg p-8 border border-amber-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white">{ahorro.nombre}</h2>
              <TrendingUp className="text-amber-400" size={32} />
            </div>

            <div className="space-y-6">
              {/* Saldo */}
              <div>
                <p className="text-amber-100 text-sm mb-1">Saldo Actual</p>
                <p className="text-5xl font-black text-amber-200">
                  ${ahorro.saldo.toFixed(2)}
                </p>
              </div>

              {/* Porcentaje */}
              <div className="bg-black/20 rounded p-4">
                <p className="text-amber-100 text-sm mb-1">Porcentaje de Ingresos</p>
                <p className="text-3xl font-bold text-amber-300">{ahorro.porcentaje}%</p>
                <p className="text-amber-100 text-xs mt-2">
                  De cada ingreso, el {ahorro.porcentaje}% se destina al ahorro
                </p>
              </div>

              {/* Tiempo Restante de Bloqueo */}
              {ahorro.fechaBloqueo && (
                <div className="bg-black/20 rounded p-4">
                  <p className="text-amber-100 text-sm mb-3">Tiempo Restante de Bloqueo</p>
                  {new Date(ahorro.fechaBloqueo) > new Date() ? (
                    <>
                      <p className="text-2xl font-bold text-amber-300 mb-2">
                        {Math.ceil((new Date(ahorro.fechaBloqueo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días
                      </p>
                      <p className="text-amber-100 text-xs">
                        Hasta: {new Date(ahorro.fechaBloqueo).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-amber-100 text-xs mt-2">
                        🔒 No puedes retirar hasta que expire el período de bloqueo
                      </p>
                    </>
                  ) : (
                    <p className="text-green-300 font-semibold">✓ Desbloqueado - Ya puedes retirar</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Configuración */}
        {!ahorro?.porcentaje && (
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h3 className="text-white font-bold text-lg mb-6">Configurar Ahorro</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 font-semibold mb-2">
                  Porcentaje de Ahorro (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={porcentaje}
                  onChange={(e) => setPorcentaje(e.target.value)}
                  placeholder="10"
                  disabled={configurando}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
                />
                <p className="text-gray-400 text-sm mt-2">
                  El resto se distribuirá entre tus otros sobres
                </p>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-2">
                  Tiempo de Bloqueo (Meses)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={tiempoBloqueoMeses}
                  onChange={(e) => setTiempoBloqueoMeses(e.target.value)}
                  placeholder="12"
                  disabled={configurando}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
                />
                <p className="text-gray-400 text-sm mt-2">
                  No podrás retirar dinero del ahorro durante este período (1-60 meses)
                </p>
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
                onClick={handleConfigurAhorro}
                disabled={configurando || !porcentaje}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 text-white font-bold rounded-lg transition"
              >
                {configurando ? 'Configurando...' : 'Configurar Ahorro'}
              </button>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
          <div className="flex gap-3">
            <Zap className="text-amber-400 flex-shrink-0" size={20} />
            <div>
              <p className="text-white font-semibold">Ahorro Automático</p>
              <p className="text-gray-400 text-sm">
                Tu porcentaje de ahorro se aplica automáticamente en cada ingreso
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
