import { redirect } from 'next/navigation'

export default function EditCVRedirect({
  params,
}: {
  params: { id: string }
}) {
  redirect(`/cv/${params.id}/edit/1`)
}
