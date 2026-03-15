'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { registerSchema, loginSchema } from '@/lib/validation/auth'

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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
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
