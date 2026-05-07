'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import type { FreelancerProfile, ServiceCatalog } from '@/lib/supabase/types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfileFormValues {
  full_name: string
  bio: string
  hourly_rate: string
  portfolio_url: string
  availability: boolean
}

// ─── Avatar section ───────────────────────────────────────────────────────────

function AvatarSection({
  userId,
  avatarUrl,
  fullName,
  onUploaded,
}: {
  userId: string
  avatarUrl: string | null
  fullName: string
  onUploaded: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = fullName
    .split(' ')
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'ME'

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `freelancer/${userId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })
      if (uploadError) throw new Error(uploadError.message)

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = urlData.publicUrl

      // Update avatar_url directly via browser client (RLS: user owns their row)
      const { error: updateErr } = await supabase
        .from('freelancer_profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', userId)
      if (updateErr) throw new Error(updateErr.message)
      onUploaded(publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={fullName}
          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-[#007BFF] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-lg font-heading font-semibold">{initials}</span>
        </div>
      )}
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-outline text-sm px-3 py-1.5 disabled:opacity-60"
        >
          {uploading ? 'Uploading…' : 'Change Photo'}
        </button>
        {error && <p className="form-error mt-1">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}

// ─── Skills tag input ─────────────────────────────────────────────────────────

function SkillsInput({
  value,
  onChange,
}: {
  value: string[]
  onChange: (tags: string[]) => void
}) {
  const [input, setInput] = useState('')

  function addTag(raw: string) {
    const tag = raw.trim()
    if (tag && !value.includes(tag)) {
      onChange([...value, tag])
    }
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  return (
    <div className="form-input min-h-[44px] flex flex-wrap gap-1.5 items-center cursor-text p-2">
      {value.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 bg-blue-100 text-[#007BFF] text-xs font-body font-medium px-2 py-0.5 rounded-full"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-blue-400 hover:text-blue-700 leading-none"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(input)}
        placeholder={value.length === 0 ? 'Type a skill and press Enter' : ''}
        className="flex-1 min-w-[120px] outline-none text-sm font-body bg-transparent"
      />
    </div>
  )
}

// ─── Completion checklist ─────────────────────────────────────────────────────

function CompletionChecklist({
  bio,
  skills,
  services,
  hourlyRate,
}: {
  bio: string
  skills: string[]
  services: string[]
  hourlyRate: string
}) {
  const items = [
    { label: 'Bio written', done: bio.trim().length > 0 },
    { label: 'At least one skill', done: skills.length > 0 },
    { label: 'At least one service', done: services.length > 0 },
    { label: 'Hourly rate set', done: hourlyRate.trim().length > 0 && Number(hourlyRate) > 0 },
  ]

  const allDone = items.every((i) => i.done)

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-sm font-body font-semibold text-neutral-700 mb-2">
        Profile completion {allDone ? '✅' : `(${items.filter((i) => i.done).length}/${items.length})`}
      </p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm font-body">
            <span className={item.done ? 'text-green-500' : 'text-neutral-300'}>
              {item.done ? '✓' : '○'}
            </span>
            <span className={item.done ? 'text-neutral-700' : 'text-neutral-400'}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FreelancerProfilePage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<FreelancerProfile | null>(null)
  const [services, setServices] = useState<ServiceCatalog[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle')
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      full_name: '',
      bio: '',
      hourly_rate: '',
      portfolio_url: '',
      availability: true,
    },
  })

  const watchedBio = watch('bio')
  const watchedHourlyRate = watch('hourly_rate')

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    setUserId(user.id)

    const [profileRes, servicesRes] = await Promise.all([
      supabase.from('freelancer_profiles').select('*').eq('user_id', user.id).single<FreelancerProfile>(),
      supabase.from('services_catalog').select('*').eq('active', true),
    ])

    if (profileRes.data) {
      const p = profileRes.data
      setProfile(p)
      setAvatarUrl(p.avatar_url)
      setSkills(p.skills ?? [])
      setSelectedServices(p.services ?? [])
      reset({
        full_name: p.full_name ?? '',
        bio: p.bio ?? '',
        hourly_rate: p.hourly_rate != null ? String(p.hourly_rate) : '',
        portfolio_url: p.portfolio_url ?? '',
        availability: p.availability ?? true,
      })
    }

    setServices((servicesRes.data ?? []) as ServiceCatalog[])
    setLoading(false)
  }, [reset])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function onSubmit(values: ProfileFormValues) {
    setSaveStatus('saving')
    setSaveError(null)
    try {
      const res = await fetch('/api/freelancer-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: values.full_name,
          bio: values.bio,
          hourly_rate: values.hourly_rate ? Number(values.hourly_rate) : null,
          portfolio_url: values.portfolio_url || null,
          availability: values.availability,
          skills,
          services: selectedServices,
        }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Save failed')
      }
      const data = (await res.json()) as { profile_completed?: boolean }
      setProfile((prev) =>
        prev ? { ...prev, profile_completed: data.profile_completed ?? false } : prev
      )
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
      setSaveStatus('error')
    }
  }

  async function handleSubmitForReview() {
    setSubmitStatus('submitting')
    try {
      const res = await fetch('/api/freelancer-profile/submit-review', {
        method: 'PATCH',
      })
      if (!res.ok) throw new Error('Submission failed')
      setSubmitStatus('submitted')
      await loadData()
    } catch {
      setSubmitStatus('error')
    }
  }

  function toggleService(serviceId: string) {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((s) => s !== serviceId) : [...prev, serviceId]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-sm font-body text-neutral-400">Loading profile…</span>
      </div>
    )
  }

  const isProfileComplete = profile?.profile_completed ?? false
  const canSubmitForReview = isProfileComplete && profile?.approval_status !== 'approved'

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <div className="section-tag mb-2">My Profile</div>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">Edit Profile</h1>
      </div>

      {/* Avatar */}
      {userId && (
        <AvatarSection
          userId={userId}
          avatarUrl={avatarUrl}
          fullName={watch('full_name') || 'ME'}
          onUploaded={setAvatarUrl}
        />
      )}

      {/* Completion checklist */}
      <CompletionChecklist
        bio={watchedBio}
        skills={skills}
        services={selectedServices}
        hourlyRate={watchedHourlyRate}
      />

      {/* Profile form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Full name */}
        <div>
          <label className="form-label" htmlFor="full_name">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="full_name"
            type="text"
            className="form-input"
            {...register('full_name', {
              required: 'Full name is required',
              minLength: { value: 2, message: 'At least 2 characters' },
            })}
          />
          {errors.full_name && <p className="form-error">{errors.full_name.message}</p>}
        </div>

        {/* Bio */}
        <div>
          <label className="form-label" htmlFor="bio">
            Bio <span className="text-red-500">*</span>
          </label>
          <textarea
            id="bio"
            rows={4}
            className="form-input resize-none"
            placeholder="Tell clients about yourself, your experience, and what makes you great…"
            {...register('bio')}
          />
        </div>

        {/* Skills */}
        <div>
          <label className="form-label">Skills</label>
          <SkillsInput value={skills} onChange={setSkills} />
          <p className="text-xs font-body text-neutral-400 mt-1">Press Enter or comma to add a skill</p>
        </div>

        {/* Services */}
        <div>
          <label className="form-label">Services Offered</label>
          {services.length === 0 ? (
            <p className="text-sm font-body text-neutral-400">No services available</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 mt-1">
              {services.map((svc) => (
                <label
                  key={svc.id}
                  className="flex items-center gap-2 cursor-pointer text-sm font-body text-neutral-700 select-none"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-neutral-300 text-[#007BFF] accent-[#007BFF]"
                    checked={selectedServices.includes(svc.id)}
                    onChange={() => toggleService(svc.id)}
                  />
                  {svc.name}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Hourly rate */}
        <div>
          <label className="form-label" htmlFor="hourly_rate">
            Hourly Rate ($/hr)
          </label>
          <input
            id="hourly_rate"
            type="number"
            min={0}
            step={0.01}
            className="form-input"
            placeholder="e.g. 50"
            {...register('hourly_rate')}
          />
        </div>

        {/* Portfolio URL */}
        <div>
          <label className="form-label" htmlFor="portfolio_url">
            Portfolio URL <span className="text-neutral-400 text-xs font-normal">(optional)</span>
          </label>
          <input
            id="portfolio_url"
            type="url"
            className="form-input"
            placeholder="https://yourportfolio.com"
            {...register('portfolio_url')}
          />
        </div>

        {/* Availability toggle */}
        <div className="flex items-center gap-3">
          <label className="form-label mb-0" htmlFor="availability">
            Available for Work
          </label>
          <input
            id="availability"
            type="checkbox"
            className="w-4 h-4 accent-[#007BFF]"
            {...register('availability')}
          />
        </div>

        {/* Save button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saveStatus === 'saving'}
            className="btn-primary disabled:opacity-60"
          >
            {saveStatus === 'saving' ? 'Saving…' : 'Save Profile'}
          </button>
          {saveStatus === 'saved' && (
            <span className="text-sm font-body text-green-600">✓ Profile saved</span>
          )}
          {saveStatus === 'error' && saveError && (
            <span className="text-sm font-body text-red-600">{saveError}</span>
          )}
        </div>
      </form>

      {/* Submit for review */}
      <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-3">
        <h2 className="font-heading font-semibold text-neutral-900">Submit for Review</h2>
        <p className="text-sm font-body text-neutral-500">
          Once your profile is complete, submit it for admin review to become visible to clients.
        </p>
        {submitStatus === 'submitted' ? (
          <p className="text-sm font-body text-green-600">
            ✓ Profile submitted for review. We&apos;ll notify you within 24 hours.
          </p>
        ) : (
          <>
            <button
              type="button"
              disabled={!canSubmitForReview || submitStatus === 'submitting'}
              onClick={handleSubmitForReview}
              className="btn-primary disabled:opacity-40"
            >
              {submitStatus === 'submitting' ? 'Submitting…' : 'Submit for Review'}
            </button>
            {!isProfileComplete && (
              <p className="text-xs font-body text-neutral-400">
                Complete your profile above to unlock submission.
              </p>
            )}
            {profile?.approval_status === 'approved' && (
              <p className="text-xs font-body text-green-600">Your profile is already approved.</p>
            )}
            {submitStatus === 'error' && (
              <p className="text-sm font-body text-red-600">Submission failed. Please try again.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
