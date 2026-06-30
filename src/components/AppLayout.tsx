import { AppLogo } from './AppLogo'
import { Sidebar } from './Sidebar'

type AppLayoutProps = {
  title: string
  children: React.ReactNode
}

export function AppLayout({ title, children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100 md:flex">
      <Sidebar />
      <main className="flex-1 bg-white">
        <header className="flex items-center gap-4 border-b border-gray-200 p-5">
          <AppLogo className="h-14 w-14" />
          <h1 className="text-2xl font-bold">{title}</h1>
        </header>
        <section className="p-6">{children}</section>
      </main>
    </div>
  )
}
