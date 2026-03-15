import { redirect } from 'next/navigation'

// Entry point for guest mode — immediately sends the user into step 1.
export default function GuestEntryPage() {
  redirect('/cv/guest/1')
}
