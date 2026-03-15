import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-5xl font-bold text-gray-200 mb-4">404</p>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Sidan hittades inte
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Sidan du letar efter finns inte eller har flyttats.
        </p>
        <Link href="/dashboard">
          <Button>Gå till startsidan</Button>
        </Link>
      </div>
    </div>
  )
}
