import { CalendarClock, LockKeyhole, Wallet } from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { savings } from '../data/mockData'

export function SavingsPage() {
  return (
    <AppLayout title="Ahorro">
      <div className="flex w-full max-w-2xl flex-col items-center gap-7">
        <div className="grid h-64 w-full max-w-lg place-items-center rounded-md border-4 border-zinc-950 bg-gradient-to-br from-sky-50 to-white shadow-[8px_8px_0_#18181b]">
          <LockKeyhole size={132} className="text-zinc-800" />
        </div>

        <div className="grid w-full gap-5 text-2xl md:grid-cols-2">
          <div className="flex items-center justify-center gap-3 rounded-full border-4 border-zinc-950 px-5 py-3 font-bold">
            <Wallet className="text-emerald-600" /> ${savings.amount}
          </div>
          <div className="flex items-center justify-center gap-3 rounded-full border-4 border-zinc-950 px-5 py-3 font-bold">
            <CalendarClock /> {savings.remainingDays} dias
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
