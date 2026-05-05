'use client'

// Thin client wrapper that lets a Server Component (the authed preview
// page) hand a cvId down to LayoutPicker. The Server Component cannot
// pass closures over useRouter directly; this wrapper is the minimum
// client boundary.

import { useRouter } from 'next/navigation'
import { updateCVSettings } from '@/lib/actions/cv'
import LayoutPicker from './LayoutPicker'
import type { CVLayout } from '@/types'

interface Props {
  cvId: string
  activeLayout: CVLayout
  accentColor: string
}

export default function AuthedLayoutPicker({ cvId, activeLayout, accentColor }: Props) {
  const router = useRouter()

  return (
    <LayoutPicker
      activeLayout={activeLayout}
      accentColor={accentColor}
      onLayoutChange={async (layout) => {
        await updateCVSettings(cvId, layout, accentColor)
        router.refresh()
      }}
      onAccentChange={async (color) => {
        await updateCVSettings(cvId, activeLayout, color)
        router.refresh()
      }}
    />
  )
}
