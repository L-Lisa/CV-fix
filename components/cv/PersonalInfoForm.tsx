'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { personalInfoSchema, type PersonalInfoValues } from '@/lib/validation/cv'
import { savePersonalInfo } from '@/lib/actions/cv'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CVPersonalInfo } from '@/types'

interface Props {
  cvId: string
  initialData: CVPersonalInfo | null
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-sm text-red-600 mt-1" role="alert">
      {message}
    </p>
  )
}

export default function PersonalInfoForm({ cvId, initialData }: Props) {
  const router = useRouter()
  const [saveError, setSaveError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      first_name: initialData?.first_name ?? '',
      last_name: initialData?.last_name ?? '',
      headline: initialData?.headline ?? '',
      phone: initialData?.phone ?? '',
      email: initialData?.email ?? '',
      city: initialData?.city ?? '',
      region: initialData?.region ?? '',
      linkedin_url: initialData?.linkedin_url ?? '',
      github_url: initialData?.github_url ?? '',
      portfolio_url: initialData?.portfolio_url ?? '',
      other_url: initialData?.other_url ?? '',
      driving_license: initialData?.driving_license ?? '',
    },
  })

  async function onSubmit(values: PersonalInfoValues) {
    setSaveError('')
    const result = await savePersonalInfo(cvId, values)

    if (!result.success) {
      setSaveError(result.error)
      return
    }

    router.push(`/cv/${cvId}/edit/2`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      {/* Name */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Namn
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name">
              Förnamn <span className="text-red-500">*</span>
            </Label>
            <Input
              id="first_name"
              className="mt-1"
              {...register('first_name')}
            />
            <FieldError message={errors.first_name?.message} />
          </div>
          <div>
            <Label htmlFor="last_name">
              Efternamn <span className="text-red-500">*</span>
            </Label>
            <Input
              id="last_name"
              className="mt-1"
              {...register('last_name')}
            />
            <FieldError message={errors.last_name?.message} />
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="headline">Yrkestitel / Rubrik</Label>
          <Input
            id="headline"
            className="mt-1"
            placeholder="t.ex. Systemutvecklare, Undersköterska"
            {...register('headline')}
          />
          <FieldError message={errors.headline?.message} />
        </div>
      </section>

      {/* Contact */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Kontaktuppgifter
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">
              Telefon <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              className="mt-1"
              placeholder="070 000 00 00"
              {...register('phone')}
            />
            <FieldError message={errors.phone?.message} />
          </div>
          <div>
            <Label htmlFor="email">
              E-postadress <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              className="mt-1"
              placeholder="namn@exempel.se"
              {...register('email')}
            />
            <FieldError message={errors.email?.message} />
          </div>
          <div>
            <Label htmlFor="city">Ort / Stad</Label>
            <Input
              id="city"
              className="mt-1"
              placeholder="Stockholm"
              {...register('city')}
            />
            <FieldError message={errors.city?.message} />
          </div>
          <div>
            <Label htmlFor="region">Region / Län</Label>
            <Input
              id="region"
              className="mt-1"
              placeholder="Stockholms län"
              {...register('region')}
            />
            <FieldError message={errors.region?.message} />
          </div>
        </div>
      </section>

      {/* Links */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Länkar (valfritt)
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="linkedin_url">LinkedIn</Label>
            <Input
              id="linkedin_url"
              type="url"
              className="mt-1"
              placeholder="https://linkedin.com/in/ditt-namn"
              {...register('linkedin_url')}
            />
            <FieldError message={errors.linkedin_url?.message} />
          </div>
          <div>
            <Label htmlFor="github_url">GitHub</Label>
            <Input
              id="github_url"
              type="url"
              className="mt-1"
              placeholder="https://github.com/ditt-namn"
              {...register('github_url')}
            />
            <FieldError message={errors.github_url?.message} />
          </div>
          <div>
            <Label htmlFor="portfolio_url">Portfolio</Label>
            <Input
              id="portfolio_url"
              type="url"
              className="mt-1"
              placeholder="https://dinportfolio.se"
              {...register('portfolio_url')}
            />
            <FieldError message={errors.portfolio_url?.message} />
          </div>
          <div>
            <Label htmlFor="other_url">Annan URL</Label>
            <Input
              id="other_url"
              type="url"
              className="mt-1"
              {...register('other_url')}
            />
            <FieldError message={errors.other_url?.message} />
          </div>
        </div>
      </section>

      {/* Other */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Övrigt
        </h3>
        <div>
          <Label htmlFor="driving_license">Körkort</Label>
          <Input
            id="driving_license"
            className="mt-1"
            placeholder="t.ex. B"
            {...register('driving_license')}
          />
          <FieldError message={errors.driving_license?.message} />
        </div>
      </section>

      {saveError && (
        <p className="text-sm text-red-600" role="alert">
          {saveError}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sparar…' : 'Spara och fortsätt'}
        </Button>
      </div>
    </form>
  )
}
