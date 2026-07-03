import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { getStoredUser } from '../data/userStorage'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { RecuperarPage } from '../pages/RecuperarPage'
import { CambiarContraseñaPage } from '../pages/CambiarContraseñaPage'
import { DashboardPage } from '../pages/DashboardPage'
import { EnvelopesPage } from '../pages/EnvelopesPage'
import { IncomePage } from '../pages/IncomePage'
import { WithdrawPage } from '../pages/WithdrawPage'
import { SavingsPage } from '../pages/SavingsPage'
import { ProfilePage } from '../pages/ProfilePage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = getStoredUser()
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/recuperar" element={<RecuperarPage />} />
        <Route path="/cambiar-contrasena" element={<CambiarContraseñaPage />} />

        {/* Protected Routes */}
        <Route
          path="/inicio"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sobres"
          element={
            <ProtectedRoute>
              <EnvelopesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ingreso"
          element={
            <ProtectedRoute>
              <IncomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/retiro"
          element={
            <ProtectedRoute>
              <WithdrawPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ahorro"
          element={
            <ProtectedRoute>
              <SavingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
