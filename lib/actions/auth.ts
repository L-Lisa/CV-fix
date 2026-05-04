'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validation/auth'

export type AuthActionResult =
  | { success: true; message?: string }
  | { success: false; error: string }

export async function register(
  formData: FormData
): Promise<AuthActionResult> {
  const raw = {
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
    coachEmail: formData.get('coachEmail') ?? '',
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { success: false, error: first.message }
  }

  const { fullName, email, password, role, coachEmail } = parsed.data

  const supabase = createClient()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) {
    console.error('register failed:', error.message)
    if (error.message.includes('already registered')) {
      return { success: false, error: 'Den här e-postadressen är redan registrerad' }
    }
    return { success: false, error: 'Det gick inte att skapa kontot. Försök igen.' }
  }

  // Update role in profiles table (trigger creates the row with default 'user')
  if (data.user && role === 'coach') {
    const admin = createAdminClient()
    await admin
      .from('profiles')
      .update({ role: 'coach' })
      .eq('id', data.user.id)
  }

  // If user provided a coach email, try to create coach_link
  if (data.user && role === 'user' && coachEmail) {
    try {
      const admin = createAdminClient()
      const { data: coachUsers } = await admin.auth.admin.listUsers()
      const coachUser = coachUsers?.users.find(
        (u) => u.email === coachEmail
      )

      if (coachUser) {
        const { data: coachProfile } = await admin
          .from('profiles')
          .select('id, role')
          .eq('id', coachUser.id)
          .single()

        if (coachProfile?.role === 'coach') {
          await admin.from('coach_links').insert({
            coach_id: coachProfile.id,
            user_id: data.user.id,
          })
        }
      }
    } catch (err) {
      // Non-fatal: coach link creation failed, log and continue
      console.error('coach_link creation failed:', err)
    }
  }

  return {
    success: true,
    message: 'Kolla din e-post och klicka på länken för att aktivera ditt konto.',
  }
}

export async function login(formData: FormData): Promise<AuthActionResult> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { success: false, error: first.message }
  }

  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    console.error('login failed:', error.message)
    return { success: false, error: 'Felaktig e-postadress eller lösenord' }
  }

  // Redirect based on role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profile?.role === 'coach') {
    redirect('/coach/dashboard')
  }

  redirect('/dashboard')
}

export async function logout(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// Sends a password-reset email. Always reports success to the user, even when
// Supabase says the address is unknown — preventing user-enumeration via the
// reset endpoint. Errors are logged server-side.
export async function requestPasswordReset(
  formData: FormData
): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    // Route through /auth/callback so the recovery code is exchanged for a
    // session before the user lands on /reset-password.
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  })

  if (error) {
    console.error('requestPasswordReset failed:', error.message)
    // Intentionally still success: do not leak whether the email exists.
  }

  return {
    success: true,
    message: 'Om kontot finns har vi skickat en återställningslänk till din e-post.',
  }
}

// Updates the password for the currently authenticated session (the user is
// authenticated via the recovery link). After success, signs them out so they
// must log in fresh — confirms the new password works and prevents lingering
// recovery-session reuse on shared devices.
export async function updatePassword(
  formData: FormData
): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    console.error('updatePassword failed:', error.message)
    return {
      success: false,
      error: 'Det gick inte att uppdatera lösenordet. Försök igen.',
    }
  }

  await supabase.auth.signOut()

  return {
    success: true,
    message: 'Lösenordet är uppdaterat. Logga in med det nya lösenordet.',
  }
}
