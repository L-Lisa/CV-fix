'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { registerSchema, type RegisterFormValues } from '@/lib/validation/auth'
import { register } from '@/lib/actions/auth'
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

export function RegisterForm() {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: 'user',
      coachEmail: '',
    },
  })

  const role = form.watch('role')

  function onSubmit(values: RegisterFormValues) {
    setServerError(null)
    setSuccessMessage(null)

    const formData = new FormData()
    formData.set('fullName', values.fullName)
    formData.set('email', values.email)
    formData.set('password', values.password)
    formData.set('role', values.role)
    formData.set('coachEmail', values.coachEmail ?? '')

    startTransition(async () => {
      const result = await register(formData)
      if (result.success) {
        setSuccessMessage(result.message ?? 'Konto skapat!')
        form.reset()
      } else {
        setServerError(result.error)
      }
    })
  }

  if (successMessage) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Kolla din e-post</CardTitle>
          <CardDescription>{successMessage}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fick du inget mail?{' '}
            <button
              type="button"
              className="underline text-foreground"
              onClick={() => setSuccessMessage(null)}
            >
              Försök igen
            </button>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Skapa konto</CardTitle>
        <CardDescription>
          Registrera dig för att spara och dela ditt CV
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {/* Full name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName">För- och efternamn</Label>
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              aria-describedby={
                form.formState.errors.fullName ? 'fullName-error' : undefined
              }
              {...form.register('fullName')}
            />
            {form.formState.errors.fullName && (
              <p id="fullName-error" className="text-sm text-destructive">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

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
              autoComplete="new-password"
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

          {/* Role */}
          <div className="space-y-1.5">
            <Label>Jag är</Label>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Roll">
              {(
                [
                  { value: 'user', label: 'Jobbsökare' },
                  { value: 'coach', label: 'Jobbcoach' },
                ] as const
              ).map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex items-center justify-center rounded-md border p-3 cursor-pointer text-sm font-medium transition-colors min-h-[44px] ${
                    role === value
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-input hover:bg-accent'
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    value={value}
                    {...form.register('role')}
                  />
                  {label}
                </label>
              ))}
            </div>
            {form.formState.errors.role && (
              <p className="text-sm text-destructive">
                {form.formState.errors.role.message}
              </p>
            )}
          </div>

          {/* Coach email — only shown when role is user */}
          {role === 'user' && (
            <div className="space-y-1.5">
              <Label htmlFor="coachEmail">
                Coachens e-post{' '}
                <span className="text-muted-foreground font-normal">(valfritt)</span>
              </Label>
              <Input
                id="coachEmail"
                type="email"
                autoComplete="off"
                placeholder="coach@exempel.se"
                aria-describedby={
                  form.formState.errors.coachEmail
                    ? 'coachEmail-error'
                    : 'coachEmail-hint'
                }
                {...form.register('coachEmail')}
              />
              <p id="coachEmail-hint" className="text-xs text-muted-foreground">
                Din coach kopplas automatiskt till ditt CV
              </p>
              {form.formState.errors.coachEmail && (
                <p id="coachEmail-error" className="text-sm text-destructive">
                  {form.formState.errors.coachEmail.message}
                </p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full min-h-[44px]" disabled={isPending}>
            {isPending ? 'Skapar konto…' : 'Skapa konto'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Har du redan ett konto?{' '}
            <Link href="/login" className="underline text-foreground">
              Logga in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
