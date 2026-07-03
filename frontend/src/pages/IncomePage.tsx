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
}

export function IncomePage() {
  const [monto, setMonto] = useState('')
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

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await apiClient.ingresos.actualizar(Number(monto))
      setSuccess(`✓ Ingreso de $${Number(monto).toFixed(2)} registrado. Distribución completada.`)
      setMonto('')
      
      // Refrescar sobres para actualizar saldos
      await fetchSobres()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Error al registrar ingreso')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const total = preview.reduce((sum, p) => sum + p.monto, 0)

  return (
    <AppLayout title="Ingresos">
      <div className="space-y-6 max-w-2xl">
        {/* Formulario */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-300 font-semibold mb-2">
                Monto a Ingresar
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="1500.00"
                  className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !monto}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 text-white font-bold rounded-lg transition"
                >
                  {loading ? 'Procesando...' : 'Registrar'}
                </button>
              </div>
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

        {/* Vista Previa de Distribución */}
        {preview.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h3 className="text-white font-bold text-lg mb-6">
              Previsualización de Distribución
            </h3>

            <div className="space-y-4">
              {preview.map((item) => (
                <div key={item.nombre} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-300 font-semibold">{item.nombre}</p>
                      <p className="text-gray-400 text-sm">{item.porcentaje}%</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">
                      ${item.monto.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-700 rounded h-2">
                    <div
                      className="bg-amber-500 h-2 rounded transition-all duration-300"
                      style={{ width: `${item.porcentaje}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-semibold">Total a Distribuir</span>
                <span className="text-3xl font-bold text-amber-400">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
