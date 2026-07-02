import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppLogo } from '../components/AppLogo'
import { Button } from '../components/button'
import { TextField } from '../components/TextField'
import { signInUser } from '../data/userStorage'

export function LoginPage() {
  const navigate = useNavigate()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    signInUser(
      String(formData.get('email') ?? ''),
      String(formData.get('password') ?? ''),
    )

    navigate('/sobres')
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-zinc-100 px-6 py-10 text-zinc-950">
      <section className="w-full max-w-3xl rounded-md border-4 border-zinc-950 bg-white px-6 py-10 shadow-[10px_10px_0_#18181b] md:px-16">
        <div className="mb-8 flex flex-col items-center gap-3">
          <AppLogo className="h-40 w-40 md:h-48 md:w-48" />
          <h1 className="text-4xl font-black">SobreSeguro</h1>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <TextField label="Correo electronico:" name="email" type="email" placeholder="Example@gmail.com" />
          <TextField label="Contrasena:" name="password" type="password" placeholder="********" />
          <div className="flex flex-col items-center gap-5 pt-3 md:flex-row md:justify-center">
            <Button type="submit">Iniciar sesion</Button>
            <Link className="font-semibold text-sky-600 underline" to="/registro">Registrar</Link>
          </div>
        </form>
      </section>
    </main>
  )
}
