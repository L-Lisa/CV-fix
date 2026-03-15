import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import Layout1 from '@/components/pdf/Layout1'
import Layout2 from '@/components/pdf/Layout2'
import Layout3 from '@/components/pdf/Layout3'
import { assembleGuestFullCV, type GuestCV } from '@/lib/guest/storage'
import { validateCV } from '@/lib/ats/validate'
import { createElement, type ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'

export async function POST(request: NextRequest) {
  let guestCV: GuestCV
  try {
    guestCV = await request.json()
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 })
  }

  const fullCV = assembleGuestFullCV(guestCV)

  // Hard ATS errors block export — same rule as the authenticated flow
  const { hard } = validateCV(fullCV)
  if (hard.length > 0) {
    return new NextResponse(
      JSON.stringify({ errors: hard.map((e) => e.message) }),
      { status: 422, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const LayoutComponent =
    guestCV.layout === 2 ? Layout2 : guestCV.layout === 3 ? Layout3 : Layout1

  let buffer: Buffer
  try {
    buffer = await renderToBuffer(
      createElement(LayoutComponent, { data: fullCV }) as ReactElement<DocumentProps>
    )
  } catch (err) {
    console.error('Guest PDF render failed:', err)
    return new NextResponse('PDF generation failed', { status: 500 })
  }

  const rawName = guestCV.title.replace(/[^a-zA-Z0-9åäöÅÄÖ\s-]/g, '').trim() || 'cv'
  const filename = `${rawName}.pdf`
  const encodedFilename = encodeURIComponent(filename)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
      'Content-Length': String(buffer.length),
    },
  })
}
