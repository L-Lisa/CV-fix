'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '@/lib/validation/auth'
import { updatePassword } from '@/lib/actions/auth'
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

export function ResetPasswordForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  function onSubmit(values: ResetPasswordFormValues) {
    setServerError(null)

    const formData = new FormData()
    formData.set('password', values.password)
    formData.set('confirmPassword', values.confirmPassword)

    startTransition(async () => {
      const result = await updatePassword(formData)
      if (!result.success) {
        setServerError(result.error)
        return
      }
      // Action signs the user out; route them to login with a success notice.
      router.replace('/login?reset=success')
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Välj nytt lösenord</CardTitle>
        <CardDescription>Minst 8 tecken.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password">Nytt lösenord</Label>
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

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Bekräfta nytt lösenord</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-describedby={
                form.formState.errors.confirmPassword
                  ? 'confirm-error'
                  : undefined
              }
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword && (
              <p id="confirm-error" className="text-sm text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full min-h-[44px]" disabled={isPending}>
            {isPending ? 'Sparar…' : 'Spara nytt lösenord'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
