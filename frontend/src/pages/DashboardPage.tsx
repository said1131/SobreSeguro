import { useEffect, useState } from 'react'
import { TrendingUp, PiggyBank, Wallet } from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { getStoredUser } from '../data/userStorage'
import { apiClient } from '../services/api'
 
interface Historial {
  fecha: string
  concepto: string
  monto: number
  sobreAsociado: string
}
 
export function DashboardPage() {
  const user = getStoredUser()
  const [totalNeto, setTotalNeto] = useState(0)
  const [totalAhorrado, setTotalAhorrado] = useState(0)
  const [sobresActivos, setSobresActivos] = useState(0)
  const [historial, setHistorial] = useState<Historial[]>([])
  const [loading, setLoading] = useState(true)
 
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Obtener sobres
        const sobresRes = await apiClient.sobres.obtener()
        if (Array.isArray(sobresRes)) {
          setSobresActivos(sobresRes.length)
          const total = sobresRes.reduce((sum, sobre) => sum + sobre.saldo, 0)
          setTotalNeto(total)
         
          const ahorro = sobresRes.find(s => s.nombre === 'Ahorro')
          if (ahorro) {
            setTotalAhorrado(ahorro.saldo)
          }
        }
 
        // Obtener ingresos para el historial
        const ingresosRes = await apiClient.ingresos.obtenerHistorialCompleto()
        if (ingresosRes && ingresosRes.historial) {
          const historialFormato = ingresosRes.historial.map((movimiento: any) => ({
            fecha: new Date(movimiento.fecha).toLocaleDateString('es-ES'),
            concepto: movimiento.concepto,
            monto: movimiento.monto,
            sobreAsociado: movimiento.sobreAsociado
          }))
          setHistorial(historialFormato)
        }
      } catch (err) {
        console.error('Error cargando datos:', err)
      } finally {
        setLoading(false)
      }
    }
 
    cargarDatos()
  }, [])
 
  const firstName = user?.firstName || 'Usuario'
 
  return (
    <AppLayout title="Inicio">
      <div className="space-y-8">
        {/* Encabezado de bienvenida mejorado */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 rounded-2xl p-8 text-white shadow-lg">
          <h1 className="text-5xl font-black mb-2">
            ¡Hola {firstName}! 👋
          </h1>
          <p className="text-amber-50 text-lg font-medium">
            Bienvenida a SobreSeguro - Administra tu dinero de forma inteligente
          </p>
        </div>
 
        {/* Estadísticas mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Saldo neto total */}
          <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-xl p-8 border border-emerald-700 hover:shadow-lg transition-all transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-emerald-100 font-semibold text-sm uppercase tracking-wide">Saldo Neto Total</h3>
              <div className="bg-emerald-700/50 p-3 rounded-lg">
                <Wallet size={24} className="text-emerald-300" />
              </div>
            </div>
            <p className="text-4xl font-black text-white mb-2">
              ${totalNeto.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
            </p>
            <p className="text-emerald-200 text-sm">Total disponible</p>
          </div>
 
          {/* Total ahorrado */}
          <div className="bg-gradient-to-br from-amber-900 to-amber-800 rounded-xl p-8 border border-amber-700 hover:shadow-lg transition-all transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-amber-100 font-semibold text-sm uppercase tracking-wide">Total Ahorrado</h3>
              <div className="bg-amber-700/50 p-3 rounded-lg">
                <PiggyBank size={24} className="text-amber-300" />
              </div>
            </div>
            <p className="text-4xl font-black text-amber-300 mb-2">
              ${totalAhorrado.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
            </p>
            <p className="text-amber-200 text-sm">Guardado en ahorro</p>
          </div>
 
          {/* Sobres activos */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-8 border border-blue-700 hover:shadow-lg transition-all transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-blue-100 font-semibold text-sm uppercase tracking-wide">Sobres Activos</h3>
              <div className="bg-blue-700/50 p-3 rounded-lg">
                <TrendingUp size={24} className="text-blue-300" />
              </div>
            </div>
            <p className="text-4xl font-black text-blue-300 mb-2">{sobresActivos}</p>
            <p className="text-blue-200 text-sm">Categorías creadas</p>
          </div>
        </div>
 
        {/* Historial de movimientos */}
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-white">Historial de Movimientos</h2>
          </div>
         
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-lg">Cargando movimientos...</p>
            </div>
          ) : historial.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-700">
                    <th className="text-left py-4 px-4 text-gray-300 font-semibold">Fecha</th>
                    <th className="text-left py-4 px-4 text-gray-300 font-semibold">Concepto</th>
                    <th className="text-left py-4 px-4 text-gray-300 font-semibold">Monto</th>
                    <th className="text-left py-4 px-4 text-gray-300 font-semibold">Sobre Asociado</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((item, idx) => {
                    const esRetiro = item.concepto.includes('Retiro')
                    const montoAbsoluto = Math.abs(item.monto)
                    return (
                      <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                        <td className="py-4 px-4 text-gray-200 font-medium">{item.fecha}</td>
                        <td className="py-4 px-4 text-gray-300">{item.concepto}</td>
                        <td className="py-4 px-4">
                          <span className={`font-bold ${esRetiro ? 'text-red-400' : 'text-emerald-400'}`}>
                            {esRetiro ? '-' : '+'}${montoAbsoluto.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-400">{item.sobreAsociado}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 text-lg">No hay movimientos registrados aún</p>
              <p className="text-gray-500 text-sm mt-2">Los movimientos aparecerán aquí cuando registres ingresos o retiros</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}