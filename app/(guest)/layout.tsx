import GuestBanner from '@/components/guest/GuestBanner'

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <GuestBanner />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  )
}
