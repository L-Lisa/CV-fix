// Layout 1 – Simple, single-column, black & white. ATS-safe.
// Uses only @react-pdf/renderer primitives — no HTML elements.

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { FullCV } from '@/types'
import {
  formatExpRange,
  formatEduRange,
  EDUCATION_LEVEL_LABELS,
  LANGUAGE_LEVEL_LABELS,
  EXP_TYPE_LABELS,
} from './shared'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
  },
  // Header
  name: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  headline: {
    fontSize: 11,
    color: '#555555',
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
    fontSize: 9,
    color: '#444444',
  },
  contactItem: {
    marginRight: 12,
  },
  // Section
  sectionContainer: {
    marginTop: 14,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingBottom: 3,
    marginBottom: 6,
    borderBottomWidth: 0.75,
    borderBottomColor: '#cccccc',
  },
  // Summary
  summary: {
    lineHeight: 1.5,
  },
  // Experience / Education entry
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  entryTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  entrySubtitle: {
    fontSize: 9,
    color: '#555555',
    marginBottom: 2,
  },
  entryDate: {
    fontSize: 9,
    color: '#777777',
    flexShrink: 0,
    marginLeft: 8,
  },
  entryDescription: {
    fontSize: 9,
    color: '#333333',
    lineHeight: 1.45,
    marginTop: 2,
    marginBottom: 6,
  },
  entryBlock: {
    marginBottom: 8,
  },
  // Skills
  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  skillItem: {
    fontSize: 9,
    marginRight: 14,
    marginBottom: 3,
  },
  // Language
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  langItem: {
    fontSize: 9,
    marginRight: 16,
    marginBottom: 3,
  },
})

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>
}

interface Props {
  data: FullCV
}

export default function Layout1({ data }: Props) {
  const { cv, personalInfo: pi, profile, experiences, educations, skills, languages, hobbies, volunteering: volunteerings, other } = data
  const lang = cv.language

  const fullName = [pi?.first_name, pi?.last_name].filter(Boolean).join(' ')
  const contactParts = [
    pi?.phone,
    pi?.email,
    pi?.city,
    pi?.linkedin_url,
    pi?.github_url,
    pi?.portfolio_url,
  ].filter(Boolean) as string[]

  const hasExperiences = experiences.length > 0
  const hasEducations = educations.length > 0
  const hasSkills = skills.length > 0
  const hasLanguages = languages.length > 0
  const hasHobbies = !!hobbies?.text
  const hasVolunteering = volunteerings.length > 0
  const hasOther = other.length > 0

  const SECTION_LABELS = lang === 'sv'
    ? {
        profile: 'Profil',
        experience: 'Arbetslivserfarenhet',
        education: 'Utbildning',
        skills: 'Kunskaper',
        languages: 'Språk',
        hobbies: 'Intressen',
        volunteering: 'Volontärarbete',
        other: 'Övrigt',
      }
    : {
        profile: 'Profile',
        experience: 'Work Experience',
        education: 'Education',
        skills: 'Skills',
        languages: 'Languages',
        hobbies: 'Interests',
        volunteering: 'Volunteering',
        other: 'Other',
      }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        {fullName ? <Text style={styles.name}>{fullName}</Text> : null}
        {pi?.headline ? <Text style={styles.headline}>{pi.headline}</Text> : null}
        {contactParts.length > 0 && (
          <View style={styles.contactRow}>
            {contactParts.map((item, i) => (
              <Text key={i} style={styles.contactItem}>{item}</Text>
            ))}
          </View>
        )}

        {/* ── Profile ── */}
        {profile?.summary ? (
          <View style={styles.sectionContainer}>
            <SectionLabel>{SECTION_LABELS.profile}</SectionLabel>
            <Text style={styles.summary}>{profile.summary}</Text>
          </View>
        ) : null}

        {/* ── Experience ── */}
        {hasExperiences && (
          <View style={styles.sectionContainer}>
            <SectionLabel>{SECTION_LABELS.experience}</SectionLabel>
            {experiences.map((exp) => {
              const typeLabel = exp.type ? EXP_TYPE_LABELS[exp.type]?.[lang] : null
              const sub = [exp.employer, exp.city, typeLabel].filter(Boolean).join(' · ')
              return (
                <View key={exp.id} style={styles.entryBlock}>
                  <View style={styles.entryRow}>
                    <Text style={styles.entryTitle}>{exp.job_title}</Text>
                    <Text style={styles.entryDate}>{formatExpRange(exp, lang)}</Text>
                  </View>
                  {sub ? <Text style={styles.entrySubtitle}>{sub}</Text> : null}
                  {exp.description ? (
                    <Text style={styles.entryDescription}>{exp.description}</Text>
                  ) : null}
                </View>
              )
            })}
          </View>
        )}

        {/* ── Education ── */}
        {hasEducations && (
          <View style={styles.sectionContainer}>
            <SectionLabel>{SECTION_LABELS.education}</SectionLabel>
            {educations.map((edu) => {
              const levelLabel = edu.level ? EDUCATION_LEVEL_LABELS[edu.level] : null
              const sub = [edu.institution, levelLabel].filter(Boolean).join(' · ')
              return (
                <View key={edu.id} style={styles.entryBlock}>
                  <View style={styles.entryRow}>
                    <Text style={styles.entryTitle}>{edu.program}</Text>
                    <Text style={styles.entryDate}>{formatEduRange(edu, lang)}</Text>
                  </View>
                  {sub ? <Text style={styles.entrySubtitle}>{sub}</Text> : null}
                  {edu.description ? (
                    <Text style={styles.entryDescription}>{edu.description}</Text>
                  ) : null}
                </View>
              )
            })}
          </View>
        )}

        {/* ── Skills ── */}
        {hasSkills && (
          <View style={styles.sectionContainer}>
            <SectionLabel>{SECTION_LABELS.skills}</SectionLabel>
            <View style={styles.skillRow}>
              {skills.map((s) => (
                <Text key={s.id} style={styles.skillItem}>
                  {s.name}{s.level ? ` (${s.level}/5)` : ''}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* ── Languages ── */}
        {hasLanguages && (
          <View style={styles.sectionContainer}>
            <SectionLabel>{SECTION_LABELS.languages}</SectionLabel>
            <View style={styles.langRow}>
              {languages.map((l) => {
                const levelLabel = l.level ? LANGUAGE_LEVEL_LABELS[l.level]?.[lang] : null
                return (
                  <Text key={l.id} style={styles.langItem}>
                    {l.language}{levelLabel ? ` – ${levelLabel}` : ''}
                  </Text>
                )
              })}
            </View>
          </View>
        )}

        {/* ── Hobbies ── */}
        {hasHobbies && (
          <View style={styles.sectionContainer}>
            <SectionLabel>{SECTION_LABELS.hobbies}</SectionLabel>
            <Text style={styles.summary}>{hobbies!.text}</Text>
          </View>
        )}

        {/* ── Volunteering ── */}
        {hasVolunteering && (
          <View style={styles.sectionContainer}>
            <SectionLabel>{SECTION_LABELS.volunteering}</SectionLabel>
            {volunteerings.map((v) => (
              <View key={v.id} style={styles.entryBlock}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryTitle}>{v.role}</Text>
                  <Text style={styles.entryDate}>
                    {formatEduRange(
                      { start_year: v.start_year, end_year: v.end_year, is_current: v.is_current } as Parameters<typeof formatEduRange>[0],
                      lang
                    )}
                  </Text>
                </View>
                <Text style={styles.entrySubtitle}>{v.organisation}</Text>
                {v.description ? (
                  <Text style={styles.entryDescription}>{v.description}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* ── Other ── */}
        {hasOther && (
          <View style={styles.sectionContainer}>
            <SectionLabel>{SECTION_LABELS.other}</SectionLabel>
            {other.map((o) => (
              <Text key={o.id} style={styles.skillItem}>
                {o.label ? `${o.label}: ` : ''}{o.text}
              </Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  )
}
