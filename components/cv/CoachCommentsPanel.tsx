import type { CVComment } from '@/types'

const SECTION_LABELS: Record<string, string> = {
  personal_info: 'Kontaktuppgifter',
  profile: 'Profil',
  experience: 'Erfarenhet',
  education: 'Utbildning',
  skills: 'Kunskaper',
  languages: 'Språk',
  hobbies: 'Intressen',
  volunteering: 'Volontärarbete',
  other: 'Övrigt',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

interface Props {
  comments: CVComment[]
}

export default function CoachCommentsPanel({ comments }: Props) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Din coach har inga kommentarer just nu.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <div key={c.id} className="border-l-2 border-amber-300 pl-3">
          <p className="text-xs font-medium text-gray-500">
            {SECTION_LABELS[c.section_type] ?? c.section_type}
          </p>
          <p className="text-sm text-gray-700 mt-0.5">{c.comment}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(c.created_at)}</p>
        </div>
      ))}
    </div>
  )
}
