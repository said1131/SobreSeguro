import { Settings } from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { EnvelopeCard } from '../components/EnvelopeCard'
import { envelopes } from '../data/mockData'

export function EnvelopesPage() {
  return (
    <AppLayout title="Sobres">
      <div className="w-full max-w-4xl">
        <div className="grid gap-8 sm:grid-cols-2">
          {envelopes.map((envelope) => (
            <EnvelopeCard key={envelope.id} {...envelope} />
          ))}
        </div>
        <button className="fixed bottom-6 right-6 grid h-16 w-16 place-items-center rounded-full border-4 border-zinc-950 bg-white text-zinc-950 shadow-[5px_5px_0_#18181b]">
          <Settings size={34} />
        </button>
      </div>
    </AppLayout>
  )
}
