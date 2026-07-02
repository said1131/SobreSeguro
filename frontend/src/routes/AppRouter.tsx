import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { EnvelopesPage } from '../pages/EnvelopesPage'
import { IncomePage } from '../pages/IncomePage'
import { WithdrawPage } from '../pages/WithdrawPage'
import { SavingsPage } from '../pages/SavingsPage'
import { ProfilePage } from '../pages/ProfilePage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/sobres" element={<EnvelopesPage />} />
        <Route path="/ingreso" element={<IncomePage />} />
        <Route path="/retiro" element={<WithdrawPage />} />
        <Route path="/ahorro" element={<SavingsPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  )
}
