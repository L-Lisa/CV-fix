import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { getFullCV } from '@/lib/queries/cv'
import Layout1 from '@/components/pdf/Layout1'
import Layout2 from '@/components/pdf/Layout2'
import Layout3 from '@/components/pdf/Layout3'
import { createElement, type ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import type { CVLayout } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const fullCV = await getFullCV(params.id)

  if (!fullCV) {
    return new NextResponse('Not found', { status: 404 })
  }

  // Verify ownership — RLS in getFullCV handles this, but double-check
  if (fullCV.cv.user_id !== user.id) {
    // Allow coach access too
    const { data: link } = await supabase
      .from('coach_links')
      .select('id')
      .eq('coach_id', user.id)
      .eq('user_id', fullCV.cv.user_id)
      .single()

    if (!link) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  // Parse layout from query param
  const rawLayout = parseInt(request.nextUrl.searchParams.get('layout') ?? '', 10)
  const layout: CVLayout = rawLayout === 2 ? 2 : rawLayout === 3 ? 3 : 1

  // Select the correct layout component
  const LayoutComponent = layout === 2 ? Layout2 : layout === 3 ? Layout3 : Layout1

  let buffer: Buffer
  try {
    buffer = await renderToBuffer(
      createElement(LayoutComponent, { data: fullCV }) as ReactElement<DocumentProps>
    )
  } catch (err) {
    console.error('PDF render failed:', err)
    return new NextResponse('PDF generation failed', { status: 500 })
  }

  // Mark the CV as exported (non-blocking — failure is non-critical)
  supabase
    .from('cvs')
    .update({ has_been_exported: true })
    .eq('id', params.id)
    .then(({ error }) => {
      if (error) console.error('has_been_exported update failed:', error.message)
    })

  const rawName = fullCV.cv.title.replace(/[^a-zA-Z0-9åäöÅÄÖ\s-]/g, '').trim() || 'cv'
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
