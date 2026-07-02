import { HandCoins } from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { Button } from '../components/button'
import { TextField } from '../components/TextField'

export function WithdrawPage() {
  return (
    <AppLayout title="Retiro">
      <form className="flex w-full max-w-xl flex-col items-center gap-7">
        <TextField label="Cantidad a retirar:" name="amount" placeholder="$500" />
        <div className="grid h-40 w-40 place-items-center rounded-md bg-sky-100 text-sky-700">
          <HandCoins size={112} />
        </div>
        <Button type="submit">Retirar</Button>
      </form>
    </AppLayout>
  )
}
