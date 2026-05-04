import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Logga in – CV-byggaren',
}

// useSearchParams() inside LoginForm forces this page to opt out of prerender
// unless wrapped in Suspense. Empty fallback because the form itself renders
// the same skeleton in either branch.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
