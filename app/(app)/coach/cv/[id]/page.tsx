import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getFullCV } from '@/lib/queries/cv'
import { getCommentsForCV } from '@/lib/queries/coach'
import CommentPanel from '@/components/coach/CommentPanel'
import { EDUCATION_LEVEL_LABELS, LANGUAGE_LEVEL_LABELS } from '@/components/pdf/shared'
import type { CVComment } from '@/types'

function sectionComments(
  comments: CVComment[],
  sectionType: string,
  itemId: string | null = null
): CVComment[] {
  return comments.filter(
    (c) => c.section_type === sectionType && c.item_id === itemId
  )
}

function formatYearRange(
  startYear: number | null,
  endYear: number | null,
  isCurrent: boolean
): string {
  if (!startYear) return ''
  const end = isCurrent ? 'pågående' : endYear ? `${endYear}` : ''
  return end ? `${startYear} – ${end}` : `${startYear}`
}

function formatExpRange(
  startMonth: number | null,
  startYear: number | null,
  endMonth: number | null,
  endYear: number | null,
  isCurrent: boolean
): string {
  const MONTHS = ['', 'jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  const start = startYear
    ? startMonth ? `${MONTHS[startMonth]} ${startYear}` : `${startYear}`
    : ''
  const end = isCurrent
    ? 'pågående'
    : endYear ? endMonth ? `${MONTHS[endMonth]} ${endYear}` : `${endYear}` : ''
  return start && end ? `${start} – ${end}` : start || end
}

export default async function CoachCVPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verify coach role
  const { data: coachProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (coachProfile?.role !== 'coach') redirect('/dashboard')

  const [fullCV, comments] = await Promise.all([
    getFullCV(params.id),
    getCommentsForCV(params.id),
  ])

  if (!fullCV) notFound()

  // Verify this coach is linked to the CV's owner
  const { data: link } = await supabase
    .from('coach_links')
    .select('id')
    .eq('coach_id', user.id)
    .eq('user_id', fullCV.cv.user_id)
    .single()

  if (!link) notFound()

  const { personalInfo: pi, profile, experiences, educations, skills, languages, hobbies, volunteering, other } = fullCV
  const fullName = [pi?.first_name, pi?.last_name].filter(Boolean).join(' ')

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/coach/participant/${fullCV.cv.user_id}`}
          className="text-sm text-gray-400 hover:text-gray-700"
        >
          ← Tillbaka
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{fullCV.cv.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Granskar CV · {fullName || 'Namnlös'}
        </p>
      </div>

      <div className="space-y-6">
        {/* Personal info */}
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Kontaktuppgifter
          </h2>
          {fullName && <p className="font-semibold text-gray-900">{fullName}</p>}
          {pi?.headline && <p className="text-sm text-gray-600">{pi.headline}</p>}
          <div className="mt-2 space-y-0.5 text-sm text-gray-600">
            {pi?.email && <p>{pi.email}</p>}
            {pi?.phone && <p>{pi.phone}</p>}
            {pi?.city && <p>{pi.city}{pi.region ? `, ${pi.region}` : ''}</p>}
            {pi?.linkedin_url && <p>{pi.linkedin_url}</p>}
          </div>
          <CommentPanel
            cvId={params.id}
            sectionType="personal_info"
            itemId={null}
            comments={sectionComments(comments, 'personal_info')}
            label="Kontaktuppgifter"
          />
        </section>

        {/* Profile */}
        {profile?.summary && (
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Profil
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">{profile.summary}</p>
            <CommentPanel
              cvId={params.id}
              sectionType="profile"
              itemId={null}
              comments={sectionComments(comments, 'profile')}
              label="Profil"
            />
          </section>
        )}

        {/* Experiences */}
        {experiences.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Arbetslivserfarenhet
            </h2>
            <div className="space-y-5">
              {experiences.map((exp) => (
                <div key={exp.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{exp.job_title}</p>
                      <p className="text-sm text-gray-600">
                        {[exp.employer, exp.city].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <p className="text-sm text-gray-400 shrink-0">
                      {formatExpRange(exp.start_month, exp.start_year, exp.end_month, exp.end_year, exp.is_current)}
                    </p>
                  </div>
                  {exp.description && (
                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                      {exp.description}
                    </p>
                  )}
                  <CommentPanel
                    cvId={params.id}
                    sectionType="experience"
                    itemId={exp.id}
                    comments={sectionComments(comments, 'experience', exp.id)}
                    label={exp.job_title ?? 'Erfarenhet'}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Educations */}
        {educations.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Utbildning
            </h2>
            <div className="space-y-5">
              {educations.map((edu) => {
                const levelLabel = edu.level ? EDUCATION_LEVEL_LABELS[edu.level] : null
                return (
                  <div key={edu.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">{edu.program}</p>
                        <p className="text-sm text-gray-600">
                          {[edu.institution, levelLabel].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <p className="text-sm text-gray-400 shrink-0">
                        {formatYearRange(edu.start_year, edu.end_year, edu.is_current)}
                      </p>
                    </div>
                    {edu.description && (
                      <p className="text-sm text-gray-600 mt-1.5">{edu.description}</p>
                    )}
                    <CommentPanel
                      cvId={params.id}
                      sectionType="education"
                      itemId={edu.id}
                      comments={sectionComments(comments, 'education', edu.id)}
                      label={edu.program ?? 'Utbildning'}
                    />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Kunskaper
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span
                  key={s.id}
                  className="text-sm bg-gray-100 text-gray-700 rounded px-2 py-0.5"
                >
                  {s.name}{s.level ? ` (${s.level}/5)` : ''}
                </span>
              ))}
            </div>
            <CommentPanel
              cvId={params.id}
              sectionType="skills"
              itemId={null}
              comments={sectionComments(comments, 'skills')}
              label="Kunskaper"
            />
          </section>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Språk
            </h2>
            <div className="space-y-1">
              {languages.map((l) => {
                const levelLabel = l.level ? LANGUAGE_LEVEL_LABELS[l.level]?.sv : null
                return (
                  <p key={l.id} className="text-sm text-gray-700">
                    {l.language}{levelLabel ? ` – ${levelLabel}` : ''}
                  </p>
                )
              })}
            </div>
            <CommentPanel
              cvId={params.id}
              sectionType="languages"
              itemId={null}
              comments={sectionComments(comments, 'languages')}
              label="Språk"
            />
          </section>
        )}

        {/* Hobbies */}
        {hobbies?.text && (
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Intressen
            </h2>
            <p className="text-sm text-gray-700">{hobbies.text}</p>
            <CommentPanel
              cvId={params.id}
              sectionType="hobbies"
              itemId={null}
              comments={sectionComments(comments, 'hobbies')}
              label="Intressen"
            />
          </section>
        )}

        {/* Other */}
        {other.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Övrigt
            </h2>
            <div className="space-y-1">
              {other.map((o) => (
                <p key={o.id} className="text-sm text-gray-700">
                  {o.label ? <span className="font-medium">{o.label}: </span> : null}
                  {o.text}
                </p>
              ))}
            </div>
            <CommentPanel
              cvId={params.id}
              sectionType="other"
              itemId={null}
              comments={sectionComments(comments, 'other')}
              label="Övrigt"
            />
          </section>
        )}
      </div>
    </div>
  )
}
