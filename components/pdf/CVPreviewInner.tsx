'use client'

// Loaded only client-side via dynamic import in CVPreviewClient.
// PDFViewer requires the browser DOM — never import this directly in a Server Component.

import { PDFViewer } from '@react-pdf/renderer'
import type { FullCV, CVLayout } from '@/types'
import Layout1 from './Layout1'
import Layout2 from './Layout2'
import Layout3 from './Layout3'

interface Props {
  fullCV: FullCV
  layout: CVLayout
}

function CVDoc({ fullCV, layout }: Props) {
  if (layout === 2) return <Layout2 data={fullCV} />
  if (layout === 3) return <Layout3 data={fullCV} />
  return <Layout1 data={fullCV} />
}

export default function CVPreviewInner({ fullCV, layout }: Props) {
  return (
    <PDFViewer width="100%" height={700} showToolbar={false} className="rounded-lg border border-gray-200">
      <CVDoc fullCV={fullCV} layout={layout} />
    </PDFViewer>
  )
}
