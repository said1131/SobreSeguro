import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, AtSign, KeyRound, UserRound } from 'lucide-react'
import { AppLogo } from '../components/AppLogo'
import { getStoredUser } from '../data/userStorage'

export function ProfilePage() {
  const profileUser = useMemo(() => getStoredUser(), [])

  return (
    <main className="min-h-dvh bg-white px-6 py-8 text-zinc-950 md:px-12">
      <header className="mb-8 flex items-center justify-between gap-4">
        <AppLogo className="h-20 w-20 md:h-24 md:w-24" />
        <Link
          to="/sobres"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border-4 border-zinc-950 bg-white shadow-[4px_4px_0_#18181b] transition hover:-translate-y-0.5"
          aria-label="Volver a sobres"
          title="Volver"
        >
          <ArrowLeft size={26} />
        </Link>
      </header>

      <section className="mx-auto w-full max-w-4xl rounded-md border-4 border-zinc-950 bg-white px-6 py-10 shadow-[10px_10px_0_#18181b] md:px-16">
        <h1 className="mb-8 text-center text-4xl font-black uppercase md:text-5xl">Datos del usuario</h1>
        <div className="mb-8 flex justify-center">
          <UserRound size={132} strokeWidth={1.7} />
        </div>
        <div className="mx-auto grid max-w-2xl gap-6 text-2xl">
          <ProfileRow icon={<UserRound />} label="Nombre" value={profileUser.firstName} />
          <ProfileRow icon={<UserRound />} label="Apellido" value={profileUser.lastName} />
          <ProfileRow icon={<AtSign />} label="Correo" value={profileUser.email} />
          <ProfileRow icon={<KeyRound />} label="Contrasena" value={profileUser.password} />
        </div>
      </section>
    </main>
  )
}

type ProfileRowProps = {
  icon: React.ReactNode
  label: string
  value: string
}

function ProfileRow({ icon, label, value }: ProfileRowProps) {
  return (
    <div className="grid gap-2 md:grid-cols-[42px_140px_1fr] md:items-end">
      <span className="hidden md:block">{icon}</span>
      <span className="font-medium">{label}:</span>
      <span className="border-b-4 border-dashed border-zinc-950 pb-1 font-medium">{value}</span>
    </div>
  )
}
