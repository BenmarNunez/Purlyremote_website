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

// ─── Portfolio image gallery ──────────────────────────────────────────────────

function PortfolioGallery({
  userId,
  images,
  onChange,
}: {
  userId: string
  images: string[]
  onChange: (next: string[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const MAX_IMAGES = 8
  const MAX_BYTES = 3 * 1024 * 1024

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    e.target.value = ''

    if (images.length + files.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images. Remove some first.`)
      return
    }

    setError(null)
    setUploading(true)
    const supabase = createClient()
    const uploaded: string[] = []

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name}: not an image`)
        continue
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name}: over 3MB`)
        continue
      }
      const ext = file.name.split('.').pop() ?? 'jpg'
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${userId}/${Date.now()}-${safe}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('portfolios')
        .upload(path, file, { upsert: false })
      if (upErr) {
        setError(`${file.name}: ${upErr.message}`)
        continue
      }
      const { data } = supabase.storage.from('portfolios').getPublicUrl(path)
      uploaded.push(data.publicUrl)
    }

    if (uploaded.length > 0) onChange([...images, ...uploaded])
    setUploading(false)
  }

  async function handleDelete(url: string) {
    if (!window.confirm('Remove this image?')) return
    const supabase = createClient()
    // Path = portion after the bucket URL prefix
    const marker = '/portfolios/'
    const idx = url.indexOf(marker)
    if (idx !== -1) {
      const path = url.slice(idx + marker.length)
      await supabase.storage.from('portfolios').remove([path])
    }
    onChange(images.filter((i) => i !== url))
  }

  return (
    <div>
      <label className="form-label">Portfolio Images <span className="text-neutral-400 text-xs font-normal">(up to {MAX_IMAGES}, 3MB each)</span></label>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {images.map((url) => (
            <div key={url} className="relative group rounded-lg overflow-hidden border border-neutral-200 aspect-square bg-neutral-50">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleDelete(url)}
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < MAX_IMAGES && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-outline text-sm px-4 py-2 disabled:opacity-60"
        >
          {uploading ? 'Uploading…' : '+ Add Images'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleUpload}
      />

      {error && <p className="form-error mt-2">{error}</p>}
    </div>
  )
}

// ─── Change password ──────────────────────────────────────────────────────────

function ChangePassword() {
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (newPass.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (newPass !== confirmPass) { setError('Passwords do not match.'); return }
    setStatus('saving')
    const supabase = createClient()
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPass })
    if (updateErr) { setError(updateErr.message); setStatus('error'); return }
    setStatus('saved')
    setNewPass('')
    setConfirmPass('')
    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-3">
      <h2 className="font-heading font-semibold text-neutral-900">Set / Change Password</h2>
      <p className="text-sm font-body text-neutral-500">
        New account? Set your password here. Existing users can update it anytime.
      </p>
      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="form-label" htmlFor="new_pass">New Password</label>
          <input
            id="new_pass"
            type="password"
            className="form-input"
            minLength={8}
            placeholder="At least 8 characters"
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
            disabled={status === 'saving'}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="form-label" htmlFor="confirm_pass">Confirm Password</label>
          <input
            id="confirm_pass"
            type="password"
            className="form-input"
            minLength={8}
            value={confirmPass}
            onChange={e => setConfirmPass(e.target.value)}
            disabled={status === 'saving'}
            autoComplete="new-password"
          />
        </div>
        {error && <p className="text-sm font-body text-red-600">{error}</p>}
        <div className="flex items-center gap-4">
          <button type="submit" disabled={status === 'saving'} className="btn-primary disabled:opacity-60">
            {status === 'saving' ? 'Saving…' : 'Save Password'}
          </button>
          {status === 'saved' && <span className="text-sm font-body text-green-600">✓ Password updated</span>}
        </div>
      </form>
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
  const [portfolioImages, setPortfolioImages] = useState<string[]>([])
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
      setPortfolioImages(p.portfolio_images ?? [])
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
          portfolio_images: portfolioImages,
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

        {/* Portfolio Images */}
        {userId && (
          <PortfolioGallery
            userId={userId}
            images={portfolioImages}
            onChange={setPortfolioImages}
          />
        )}

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

      {/* Change password */}
      <ChangePassword />

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
