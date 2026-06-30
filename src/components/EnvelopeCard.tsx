type EnvelopeCardProps = {
  name: string
  balance: number
}

export function EnvelopeCard({ name, balance }: EnvelopeCardProps) {
  return (
    <article className="rounded-md border border-gray-300 bg-white p-5 text-center">
      <div className="mx-auto mb-3 flex h-20 w-28 items-center justify-center rounded-md border border-gray-400 bg-gray-100">
        <span className="text-3xl">✉</span>
      </div>
      <h3 className="text-xl font-bold">{name}</h3>
      <p className="text-gray-600">Saldo: ${balance.toLocaleString('es-MX')}</p>
    </article>
  )
}
