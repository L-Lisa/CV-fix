'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CommentPanel from '@/components/coach/CommentPanel'
import PersonalInfoForm from '@/components/cv/PersonalInfoForm'
import ProfileTextForm from '@/components/cv/ProfileTextForm'
import ExperienceForm from '@/components/cv/ExperienceForm'
import EducationForm from '@/components/cv/EducationForm'
import SkillsLanguagesForm from '@/components/cv/SkillsLanguagesForm'
import {
  EDUCATION_LEVEL_LABELS,
  LANGUAGE_LEVEL_LABELS,
  formatYearRange,
  formatExpRange,
} from '@/components/pdf/shared'
import {
  coachSavePersonalInfo,
  coachSaveProfileText,
  coachSaveExperiences,
  coachSaveEducations,
  coachSaveStep5,
} from '@/lib/actions/coach'
import type { FullCV, CVComment } from '@/types'

type EditableSection =
  | 'personal_info'
  | 'profile'
  | 'experiences'
  | 'educations'
  | 'step5'

interface Props {
  cvId: string
  fullCV: FullCV
  comments: CVComment[]
}

function sectionComments(
  comments: CVComment[],
  sectionType: string,
  itemId: string | null = null
): CVComment[] {
  return comments.filter(
    (c) => c.section_type === sectionType && c.item_id === itemId
  )
}

function SectionHeader({
  title,
  section,
  editing,
  onEdit,
  onCancel,
}: {
  title: string
  section: EditableSection
  editing: boolean
  onEdit: (s: EditableSection) => void
  onCancel: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        {title}
      </h2>
      {editing ? (
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Avbryt
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onEdit(section)}
          className="text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          Redigera
        </button>
      )}
    </div>
  )
}

export default function CoachCVPageClient({ cvId, fullCV, comments }: Props) {
  const router = useRouter()
  const [editingSection, setEditingSection] = useState<EditableSection | null>(null)

  const { personalInfo: pi, profile, experiences, educations, skills, languages, hobbies, volunteering, other } = fullCV

  function handleEdit(section: EditableSection) {
    setEditingSection(section)
  }

  function handleCancel() {
    setEditingSection(null)
  }

  function handleAfterSave() {
    setEditingSection(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Personal info */}
      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <SectionHeader
          title="Kontaktuppgifter"
          section="personal_info"
          editing={editingSection === 'personal_info'}
          onEdit={handleEdit}
          onCancel={handleCancel}
        />
        {editingSection === 'personal_info' ? (
          <PersonalInfoForm
            cvId={cvId}
            initialData={pi}
            onSave={(values) => coachSavePersonalInfo(cvId, values)}
            onAfterSave={handleAfterSave}
          />
        ) : (
          <>
            {pi?.first_name || pi?.last_name ? (
              <p className="font-semibold text-gray-900">
                {[pi.first_name, pi.last_name].filter(Boolean).join(' ')}
              </p>
            ) : null}
            {pi?.headline && <p className="text-sm text-gray-600">{pi.headline}</p>}
            <div className="mt-2 space-y-0.5 text-sm text-gray-600">
              {pi?.email && <p>{pi.email}</p>}
              {pi?.phone && <p>{pi.phone}</p>}
              {pi?.city && (
                <p>{pi.city}{pi.region ? `, ${pi.region}` : ''}</p>
              )}
              {pi?.linkedin_url && <p>{pi.linkedin_url}</p>}
            </div>
            <CommentPanel
              cvId={cvId}
              sectionType="personal_info"
              itemId={null}
              comments={sectionComments(comments, 'personal_info')}
              label="Kontaktuppgifter"
            />
          </>
        )}
      </section>

      {/* Profile */}
      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <SectionHeader
          title="Profil"
          section="profile"
          editing={editingSection === 'profile'}
          onEdit={handleEdit}
          onCancel={handleCancel}
        />
        {editingSection === 'profile' ? (
          <ProfileTextForm
            cvId={cvId}
            initialSummary={profile?.summary ?? null}
            onSave={(values) => coachSaveProfileText(cvId, values)}
            onAfterSave={handleAfterSave}
          />
        ) : (
          <>
            {profile?.summary ? (
              <p className="text-sm text-gray-700 leading-relaxed">{profile.summary}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">Ingen profiltext ännu.</p>
            )}
            <CommentPanel
              cvId={cvId}
              sectionType="profile"
              itemId={null}
              comments={sectionComments(comments, 'profile')}
              label="Profil"
            />
          </>
        )}
      </section>

      {/* Experiences */}
      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <SectionHeader
          title="Arbetslivserfarenhet"
          section="experiences"
          editing={editingSection === 'experiences'}
          onEdit={handleEdit}
          onCancel={handleCancel}
        />
        {editingSection === 'experiences' ? (
          <ExperienceForm
            cvId={cvId}
            initialData={experiences}
            onSave={(values) => coachSaveExperiences(cvId, values)}
            onAfterSave={handleAfterSave}
          />
        ) : experiences.length > 0 ? (
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
                    {formatExpRange(exp, 'sv')}
                  </p>
                </div>
                {exp.description && (
                  <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                    {exp.description}
                  </p>
                )}
                <CommentPanel
                  cvId={cvId}
                  sectionType="experience"
                  itemId={exp.id}
                  comments={sectionComments(comments, 'experience', exp.id)}
                  label={exp.job_title ?? 'Erfarenhet'}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Inga erfarenheter ännu.</p>
        )}
      </section>

      {/* Educations */}
      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <SectionHeader
          title="Utbildning"
          section="educations"
          editing={editingSection === 'educations'}
          onEdit={handleEdit}
          onCancel={handleCancel}
        />
        {editingSection === 'educations' ? (
          <EducationForm
            cvId={cvId}
            initialData={educations}
            onSave={(values) => coachSaveEducations(cvId, values)}
            onAfterSave={handleAfterSave}
          />
        ) : educations.length > 0 ? (
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
                      {formatYearRange(edu.start_year, edu.end_year, edu.is_current, 'sv')}
                    </p>
                  </div>
                  {edu.description && (
                    <p className="text-sm text-gray-600 mt-1.5">{edu.description}</p>
                  )}
                  <CommentPanel
                    cvId={cvId}
                    sectionType="education"
                    itemId={edu.id}
                    comments={sectionComments(comments, 'education', edu.id)}
                    label={edu.program ?? 'Utbildning'}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Ingen utbildning ännu.</p>
        )}
      </section>

      {/* Skills / Languages / Hobbies / Volunteering / Other (step 5) */}
      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <SectionHeader
          title="Kunskaper, språk & övrigt"
          section="step5"
          editing={editingSection === 'step5'}
          onEdit={handleEdit}
          onCancel={handleCancel}
        />
        {editingSection === 'step5' ? (
          <SkillsLanguagesForm
            cvId={cvId}
            initialSkills={skills}
            initialLanguages={languages}
            initialHobbies={hobbies}
            initialVolunteerings={volunteering}
            initialOthers={other}
            onSave={(values) => coachSaveStep5(cvId, values)}
            onAfterSave={handleAfterSave}
          />
        ) : (
          <>
            {skills.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Kunskaper
                </p>
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
                  cvId={cvId}
                  sectionType="skills"
                  itemId={null}
                  comments={sectionComments(comments, 'skills')}
                  label="Kunskaper"
                />
              </div>
            )}

            {languages.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Språk
                </p>
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
                  cvId={cvId}
                  sectionType="languages"
                  itemId={null}
                  comments={sectionComments(comments, 'languages')}
                  label="Språk"
                />
              </div>
            )}

            {hobbies?.text && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Intressen
                </p>
                <p className="text-sm text-gray-700">{hobbies.text}</p>
                <CommentPanel
                  cvId={cvId}
                  sectionType="hobbies"
                  itemId={null}
                  comments={sectionComments(comments, 'hobbies')}
                  label="Intressen"
                />
              </div>
            )}

            {volunteering.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Volontärarbete
                </p>
                <div className="space-y-1">
                  {volunteering.map((v) => (
                    <p key={v.id} className="text-sm text-gray-700">
                      {v.role ? <span className="font-medium">{v.role}</span> : null}
                      {v.role && v.organisation ? ' · ' : null}
                      {v.organisation ?? ''}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {other.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Övrigt
                </p>
                <div className="space-y-1">
                  {other.map((o) => (
                    <p key={o.id} className="text-sm text-gray-700">
                      {o.label ? <span className="font-medium">{o.label}: </span> : null}
                      {o.text}
                    </p>
                  ))}
                </div>
                <CommentPanel
                  cvId={cvId}
                  sectionType="other"
                  itemId={null}
                  comments={sectionComments(comments, 'other')}
                  label="Övrigt"
                />
              </div>
            )}

            {skills.length === 0 && languages.length === 0 && !hobbies?.text && volunteering.length === 0 && other.length === 0 && (
              <p className="text-sm text-gray-400 italic">Inga uppgifter ännu.</p>
            )}
          </>
        )}
      </section>
    </div>
  )
}
