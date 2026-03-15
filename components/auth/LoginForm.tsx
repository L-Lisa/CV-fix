'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { loginSchema, type LoginFormValues } from '@/lib/validation/auth'
import { login } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function LoginForm() {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  function onSubmit(values: LoginFormValues) {
    setServerError(null)

    const formData = new FormData()
    formData.set('email', values.email)
    formData.set('password', values.password)

    startTransition(async () => {
      const result = await login(formData)
      if (!result.success) {
        setServerError(result.error)
      }
      // On success, login() calls redirect() — no client-side handling needed
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Logga in</CardTitle>
        <CardDescription>Välkommen tillbaka</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">E-postadress</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-describedby={
                form.formState.errors.email ? 'email-error' : undefined
              }
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Lösenord</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-describedby={
                form.formState.errors.password ? 'password-error' : undefined
              }
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full min-h-[44px]" disabled={isPending}>
            {isPending ? 'Loggar in…' : 'Logga in'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Har du inget konto?{' '}
            <Link href="/register" className="underline text-foreground">
              Skapa konto
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
