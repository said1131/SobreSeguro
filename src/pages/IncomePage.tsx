import { Banknote } from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { Button } from '../components/button'
import { TextField } from '../components/TextField'

export function IncomePage() {
  return (
    <AppLayout title="Ingreso">
      <form className="flex w-full max-w-xl flex-col items-center gap-7">
        <TextField label="Cantidad a ingresar:" name="amount" placeholder="$1500" />
        <div className="grid h-40 w-40 place-items-center rounded-md bg-lime-100 text-emerald-700">
          <Banknote size={112} />
        </div>
        <Button type="submit">Ingresar</Button>
      </form>
    </AppLayout>
  )
}
