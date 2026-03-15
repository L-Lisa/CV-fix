// Layout 3 – Extended single-column with a light-grey sidebar strip for
// contact details, skills and languages. Main column holds narrative sections.
// Still single-column text flow → ATS-safe.

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { FullCV } from '@/types'
import {
  formatExpRange,
  formatEduRange,
  formatYearRange,
  EDUCATION_LEVEL_LABELS,
  LANGUAGE_LEVEL_LABELS,
  EXP_TYPE_LABELS,
} from './shared'

const SIDEBAR_WIDTH = 160

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
    flexDirection: 'row',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: '#f3f4f6',
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 16,
    minHeight: '100%',
  },
  sidebarName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
    color: '#111827',
  },
  sidebarHeadline: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 1.4,
  },
  sidebarSectionLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#9ca3af',
    marginBottom: 4,
    marginTop: 12,
  },
  sidebarItem: {
    fontSize: 8.5,
    color: '#374151',
    marginBottom: 2,
    lineHeight: 1.4,
  },
  sidebarContact: {
    fontSize: 8,
    color: '#4b5563',
    marginBottom: 3,
    lineHeight: 1.4,
    wordBreak: 'break-all',
  },
  // Main column
  main: {
    flex: 1,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 32,
  },
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
    borderBottomColor: '#e5e7eb',
  },
  summary: {
    lineHeight: 1.5,
    fontSize: 10,
  },
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
})

interface Props {
  data: FullCV
}

export default function Layout3({ data }: Props) {
  const { cv, personalInfo: pi, profile, experiences, educations, skills, languages, hobbies, volunteering: volunteerings, other } = data
  const lang = cv.language

  const fullName = [pi?.first_name, pi?.last_name].filter(Boolean).join(' ')

  const LABELS = lang === 'sv'
    ? { profile: 'Profil', experience: 'Arbetslivserfarenhet', education: 'Utbildning', skills: 'Kunskaper', languages: 'Språk', hobbies: 'Intressen', volunteering: 'Volontärarbete', other: 'Övrigt', contact: 'Kontakt' }
    : { profile: 'Profile', experience: 'Work Experience', education: 'Education', skills: 'Skills', languages: 'Languages', hobbies: 'Interests', volunteering: 'Volunteering', other: 'Other', contact: 'Contact' }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Sidebar ── */}
        <View style={styles.sidebar}>
          {fullName ? <Text style={styles.sidebarName}>{fullName}</Text> : null}
          {pi?.headline ? <Text style={styles.sidebarHeadline}>{pi.headline}</Text> : null}

          {/* Contact */}
          <Text style={styles.sidebarSectionLabel}>{LABELS.contact}</Text>
          {[pi?.phone, pi?.email, pi?.city, pi?.region].filter(Boolean).map((item, i) => (
            <Text key={i} style={styles.sidebarContact}>{item}</Text>
          ))}
          {[pi?.linkedin_url, pi?.github_url, pi?.portfolio_url].filter(Boolean).map((item, i) => (
            <Text key={i} style={styles.sidebarContact}>{item}</Text>
          ))}
          {pi?.driving_license ? (
            <Text style={styles.sidebarContact}>{lang === 'sv' ? 'Körkort' : 'Driving licence'}: {pi.driving_license}</Text>
          ) : null}

          {/* Skills */}
          {skills.length > 0 && (
            <>
              <Text style={styles.sidebarSectionLabel}>{LABELS.skills}</Text>
              {skills.map((s) => (
                <Text key={s.id} style={styles.sidebarItem}>
                  {s.name}{s.level ? ` (${s.level}/5)` : ''}
                </Text>
              ))}
            </>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <>
              <Text style={styles.sidebarSectionLabel}>{LABELS.languages}</Text>
              {languages.map((l) => {
                const levelLabel = l.level ? LANGUAGE_LEVEL_LABELS[l.level]?.[lang] : null
                return (
                  <Text key={l.id} style={styles.sidebarItem}>
                    {l.language}{levelLabel ? ` – ${levelLabel}` : ''}
                  </Text>
                )
              })}
            </>
          )}
        </View>

        {/* ── Main column ── */}
        <View style={styles.main}>
          {profile?.summary && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>{LABELS.profile}</Text>
              <Text style={styles.summary}>{profile.summary}</Text>
            </View>
          )}

          {experiences.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>{LABELS.experience}</Text>
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
                    {exp.description ? <Text style={styles.entryDescription}>{exp.description}</Text> : null}
                  </View>
                )
              })}
            </View>
          )}

          {educations.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>{LABELS.education}</Text>
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
                    {edu.description ? <Text style={styles.entryDescription}>{edu.description}</Text> : null}
                  </View>
                )
              })}
            </View>
          )}

          {hobbies?.text && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>{LABELS.hobbies}</Text>
              <Text style={styles.summary}>{hobbies.text}</Text>
            </View>
          )}

          {volunteerings.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>{LABELS.volunteering}</Text>
              {volunteerings.map((v) => (
                <View key={v.id} style={styles.entryBlock}>
                  <View style={styles.entryRow}>
                    <Text style={styles.entryTitle}>{v.role}</Text>
                    <Text style={styles.entryDate}>
                      {formatYearRange(v.start_year, v.end_year, v.is_current, lang)}
                    </Text>
                  </View>
                  <Text style={styles.entrySubtitle}>{v.organisation}</Text>
                  {v.description ? <Text style={styles.entryDescription}>{v.description}</Text> : null}
                </View>
              ))}
            </View>
          )}

          {other.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>{LABELS.other}</Text>
              {other.map((o) => (
                <Text key={o.id} style={{ fontSize: 9, marginBottom: 3 }}>
                  {o.label ? `${o.label}: ` : ''}{o.text}
                </Text>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}
