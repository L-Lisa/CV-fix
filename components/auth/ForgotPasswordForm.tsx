'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/lib/validation/auth'
import { requestPasswordReset } from '@/lib/actions/auth'
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

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [serverNotice, setServerNotice] = useState<string | null>(null)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  function onSubmit(values: ForgotPasswordFormValues) {
    setServerError(null)
    setServerNotice(null)

    const formData = new FormData()
    formData.set('email', values.email)

    startTransition(async () => {
      const result = await requestPasswordReset(formData)
      if (result.success) {
        setServerNotice(
          result.message ??
            'Om kontot finns har vi skickat en återställningslänk till din e-post.'
        )
        form.reset()
      } else {
        setServerError(result.error)
      }
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Glömt lösenord?</CardTitle>
        <CardDescription>
          Skriv in din e-postadress så skickar vi en länk för att välja ett nytt
          lösenord.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {serverNotice && (
            <Alert>
              <AlertDescription>{serverNotice}</AlertDescription>
            </Alert>
          )}

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

          <Button type="submit" className="w-full min-h-[44px]" disabled={isPending}>
            {isPending ? 'Skickar…' : 'Skicka återställningslänk'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="underline text-foreground">
              Tillbaka till inloggning
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
