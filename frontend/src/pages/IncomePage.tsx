import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { CreditCard } from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { apiClient } from '../services/api'

interface Sobre {
  id: number
  nombre: string
  porcentaje: number
  saldo: number
  esAhorro: boolean
  activo: boolean
}

export function IncomePage() {
  const [monto, setMonto] = useState('')
  const [metodoPago, setMetodoPago] = useState('Tarjeta')
  const [nombreTitular, setNombreTitular] = useState('')
  const [numeroTarjeta, setNumeroTarjeta] = useState('')
  const [fechaExp, setFechaExp] = useState('')
  const [cvv, setCvv] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [sobres, setSobres] = useState<Sobre[]>([])
  const [preview, setPreview] = useState<{ nombre: string; porcentaje: number; monto: number }[]>([])

  useEffect(() => {
    fetchSobres()
  }, [])

  async function fetchSobres() {
    try {
      const result = await apiClient.sobres.obtener()
      setSobres(result || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo conectar con el servidor.'
      setError(message)
      console.error(err)
    }
  }

  useEffect(() => {
    if (!monto || isNaN(Number(monto))) {
      setPreview([])
      return
    }

    const cantidad = Number(monto)
    const ahorroSobre = sobres.find(s => s.esAhorro)
    const otrosSobres = sobres.filter(s => !s.esAhorro && s.activo)

    const distribucion = []

    if (ahorroSobre) {
      const montoAhorro = (cantidad * ahorroSobre.porcentaje) / 100
      distribucion.push({
        nombre: ahorroSobre.nombre,
        porcentaje: ahorroSobre.porcentaje,
        monto: montoAhorro,
      })
    }

    const porcentajeTotal = otrosSobres.reduce((sum, s) => sum + s.porcentaje, 0)
    const porcentajeRestante = Math.max(0, 100 - (ahorroSobre?.porcentaje || 0) - porcentajeTotal)
    if (porcentajeRestante > 0) {
      distribucion.push({
        nombre: 'Residuo',
        porcentaje: porcentajeRestante,
        monto: (cantidad * porcentajeRestante) / 100,
      })
    }

    otrosSobres.forEach((sobre) => {
      const montoDistribuido = (cantidad * sobre.porcentaje) / 100
      distribucion.push({
        nombre: sobre.nombre,
        porcentaje: sobre.porcentaje,
        monto: montoDistribuido,
      })
    })

    setPreview(distribucion)
  }, [monto, sobres])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
      setError('Ingresa un monto válido')
      return
    }

    if (metodoPago === 'Tarjeta' && (!nombreTitular || !numeroTarjeta || !fechaExp || !cvv)) {
      setError('Completa todos los datos de la tarjeta')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await apiClient.ingresos.actualizar(Number(monto))
      setSuccess(`✓ Ingreso de $${Number(monto).toFixed(2)} registrado vía ${metodoPago}. Distribución completada.`)
      setMonto('')
      setNombreTitular('')
      setNumeroTarjeta('')
      setFechaExp('')
      setCvv('')
      
      // Refrescar sobres para actualizar saldos
      await fetchSobres()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo conectar con el servidor.'
      setError(message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const total = preview.reduce((sum, p) => sum + p.monto, 0)

  return (
    <AppLayout title="Ingresos">
      <div className="space-y-6 max-w-6xl">
        <div className="grid xl:grid-cols-[1.05fr_0.95fr] gap-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Registrar ingreso</h2>
                <p className="text-gray-400 mt-1">Organiza tu dinero con una distribución clara y visual</p>
              </div>
              <div className="rounded-full bg-amber-500/20 px-4 py-2 text-amber-300 text-sm font-semibold">
                Flujo automático
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-[1.15fr_0.85fr] gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-2">
                    Monto a Ingresar
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      placeholder="1500.00"
                      className="w-full pl-8 pr-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-2">
                    Método de pago
                  </label>
                  <div className="relative">
                    <select
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50"
                      disabled={loading}
                    >
                      <option>Tarjeta</option>
                      <option>Transferencia</option>
                      <option>Depósito</option>
                    </select>
                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                </div>
              </div>

              {metodoPago === 'Tarjeta' && (
                <div className="rounded-2xl border border-amber-700/50 bg-amber-900/20 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold">
                    <CreditCard size={18} />
                    Datos de la tarjeta
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Nombre del titular</label>
                      <input
                        value={nombreTitular}
                        onChange={(e) => setNombreTitular(e.target.value)}
                        placeholder="Juan Pérez"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Número de tarjeta</label>
                      <input
                        value={numeroTarjeta}
                        onChange={(e) => {
                         const val = e.target.value.replace(/\D/g, '').slice(0, 16)
                          const formatted = val.match(/.{1,4}/g)?.join(' ') || val
                          setNumeroTarjeta(formatted)
                       }}
                       placeholder="4242 4242 4242 4242"
                       maxLength={19}
                       className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg"
                       />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Fecha de expiración</label>
                      <input
  value={fechaExp}
  onChange={(e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    const formatted = val.length >= 3 ? val.slice(0, 2) + '/' + val.slice(2) : val
    setFechaExp(formatted)
  }}
  placeholder="MM/AA"
  maxLength={5}
  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg"
/>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">CVV</label>
                      <input
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="123"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !monto}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 text-white font-bold rounded-lg transition"
                >
                  {loading ? 'Procesando...' : 'Registrar ingreso'}
                </button>
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
            </form>
          </div>

          {preview.length > 0 ? (
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-lg h-fit">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-white font-bold text-lg">Vista previa de distribución</h3>
                  <p className="text-gray-400 text-sm">El exceso se guarda en el sobre Residuo hasta que completes el 100%</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Total</p>
                  <p className="text-2xl font-bold text-amber-400">${total.toFixed(2)}</p>
                </div>
              </div>
              <div className="space-y-4">
                {preview.map((item) => (
                  <div key={item.nombre} className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="text-gray-300 font-semibold">{item.nombre}</p>
                        <p className="text-gray-400 text-sm">{item.porcentaje}%</p>
                      </div>
                      <p className="text-xl font-bold text-amber-400">${item.monto.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-600 rounded h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-yellow-400 h-2 rounded transition-all duration-300"
                        style={{ width: `${Math.min(100, item.porcentaje)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-lg h-fit flex flex-col items-center justify-center text-center gap-4 min-h-64">
              <div className="rounded-full bg-amber-500/20 p-6">
                <CreditCard size={40} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Sin distribución aún</h3>
                <p className="text-gray-400 text-sm mt-1">Ingresa un monto para ver cómo se distribuirá entre tus sobres automáticamente.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  )
}