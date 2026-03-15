'use client'

// This file is the entry point for the dynamic import in the preview page.
// It re-exports CVPreviewInner so that all @react-pdf/renderer browser-only
// code is kept out of the SSR bundle.

import CVPreviewInner from './CVPreviewInner'
import type { FullCV, CVLayout } from '@/types'

interface Props {
  fullCV: FullCV
  layout: CVLayout
}

export default function CVPreviewClient({ fullCV, layout }: Props) {
  return <CVPreviewInner fullCV={fullCV} layout={layout} />
}
