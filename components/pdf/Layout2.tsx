// Layout 2 – Single-column with a coloured header band. ATS-safe.
// Accent colour is read from cv.accent_color (default #2563eb).

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

function makeStyles(accent: string) {
  return StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 10,
      color: '#1a1a1a',
      paddingBottom: 48,
      paddingHorizontal: 0,
    },
    // Coloured header band
    header: {
      backgroundColor: accent,
      paddingHorizontal: 48,
      paddingTop: 36,
      paddingBottom: 24,
      marginBottom: 0,
    },
    name: {
      fontSize: 22,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      marginBottom: 3,
    },
    headline: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.85)',
      marginBottom: 8,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      fontSize: 9,
      color: 'rgba(255,255,255,0.9)',
    },
    contactItem: {
      marginRight: 14,
    },
    // Body
    body: {
      paddingHorizontal: 48,
      paddingTop: 20,
    },
    sectionContainer: {
      marginTop: 14,
    },
    sectionLabel: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: accent,
      textTransform: 'uppercase',
      letterSpacing: 1,
      paddingBottom: 3,
      marginBottom: 6,
      borderBottomWidth: 0.75,
      borderBottomColor: accent,
    },
    summary: {
      lineHeight: 1.5,
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
    skillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    skillItem: {
      fontSize: 9,
      marginRight: 14,
      marginBottom: 3,
    },
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
}

interface Props {
  data: FullCV
}

export default function Layout2({ data }: Props) {
  const { cv, personalInfo: pi, profile, experiences, educations, skills, languages, hobbies, volunteering: volunteerings, other } = data
  const lang = cv.language
  const accent = cv.accent_color || '#2563eb'
  const styles = makeStyles(accent)

  const fullName = [pi?.first_name, pi?.last_name].filter(Boolean).join(' ')
  const contactParts = [
    pi?.phone,
    pi?.email,
    pi?.city,
    pi?.linkedin_url,
    pi?.github_url,
  ].filter(Boolean) as string[]

  const LABELS = lang === 'sv'
    ? { profile: 'Profil', experience: 'Arbetslivserfarenhet', education: 'Utbildning', skills: 'Kunskaper', languages: 'Språk', hobbies: 'Intressen', volunteering: 'Volontärarbete', other: 'Övrigt' }
    : { profile: 'Profile', experience: 'Work Experience', education: 'Education', skills: 'Skills', languages: 'Languages', hobbies: 'Interests', volunteering: 'Volunteering', other: 'Other' }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Coloured header */}
        <View style={styles.header}>
          {fullName ? <Text style={styles.name}>{fullName}</Text> : null}
          {pi?.headline ? <Text style={styles.headline}>{pi.headline}</Text> : null}
          {contactParts.length > 0 && (
            <View style={styles.contactRow}>
              {contactParts.map((item, i) => (
                <Text key={i} style={styles.contactItem}>{item}</Text>
              ))}
            </View>
          )}
        </View>

        <View style={styles.body}>
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

          {skills.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>{LABELS.skills}</Text>
              <View style={styles.skillRow}>
                {skills.map((s) => (
                  <Text key={s.id} style={styles.skillItem}>
                    {s.name}{s.level ? ` (${s.level}/5)` : ''}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {languages.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>{LABELS.languages}</Text>
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
                <Text key={o.id} style={styles.skillItem}>
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
