import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppLogo } from '../components/AppLogo'
import { Button } from '../components/button'
import { TextField } from '../components/TextField'
import { saveStoredUser } from '../data/userStorage'

export function RegisterPage() {
  const navigate = useNavigate()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    saveStoredUser({
      firstName: String(formData.get('firstName') ?? ''),
      lastName: String(formData.get('lastName') ?? ''),
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    })

    navigate('/sobres')
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-zinc-100 px-6 py-10 text-zinc-950">
      <section className="w-full max-w-4xl rounded-md border-4 border-zinc-950 bg-white px-6 py-10 shadow-[10px_10px_0_#18181b] md:px-16">
        <div className="mb-6 flex items-center gap-4">
          <AppLogo className="h-20 w-20" />
          <h1 className="text-4xl font-black">Registro</h1>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <TextField label="Nombre:" name="firstName" placeholder="Karla Jhoana" required />
          <TextField label="Apellido:" name="lastName" placeholder="Chi Rodriguez" required />
          <TextField label="Correo:" name="email" type="email" placeholder="Example@gmail.com" required />
          <TextField label="Contrasena:" name="password" type="password" placeholder="********" required />
          <div className="flex flex-col items-center gap-5 pt-3 md:flex-row md:justify-center">
            <Button type="submit">Registrar</Button>
            <Link className="font-semibold text-sky-600 underline" to="/login">Iniciar sesion</Link>
          </div>
        </form>
      </section>
    </main>
  )
}

