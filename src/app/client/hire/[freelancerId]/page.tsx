'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import type { FreelancerProfile } from '@/lib/supabase/types'

// ─── Schema ──────────────────────────────────────────────────────────────────

const hireSchema = z.object({
  service: z.string().min(1, 'Please select a service'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  timeline: z.string().optional(),
  budget_range: z.string().optional(),
})

type HireFormValues = z.infer<typeof hireSchema>

// ─── Component ───────────────────────────────────────────────────────────────

export default function HirePage() {
  const params = useParams()
  const router = useRouter()
  const freelancerId = params.freelancerId as string

  const [freelancer, setFreelancer] = useState<FreelancerProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HireFormValues>({
    resolver: zodResolver(hireSchema),
  })

  useEffect(() => {
    async function loadFreelancer() {
      try {
        const res = await fetch(`/api/freelancers/${freelancerId}`)
        if (!res.ok) return
        const data = (await res.json()) as FreelancerProfile
        setFreelancer(data)
      } finally {
        setLoadingProfile(false)
      }
    }
    loadFreelancer()
  }, [freelancerId])

  async function onSubmit(values: HireFormValues) {
    setSubmitError(null)

    const res = await fetch('/api/hire-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        freelancer_id: freelancerId,
        service: values.service,
        description: values.description,
        timeline: values.timeline ?? undefined,
        budget_range: values.budget_range ?? undefined,
      }),
    })

    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      setSubmitError(body.error ?? 'Something went wrong. Please try again.')
      return
    }

    router.push('/client/requests')
  }

  if (loadingProfile) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card p-8 animate-pulse space-y-4">
          <div className="h-6 bg-neutral-200 rounded w-1/2" />
          <div className="h-4 bg-neutral-200 rounded w-1/3" />
          <div className="h-32 bg-neutral-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="card p-8">
        {/* Heading */}
        <div className="mb-6">
          <Link href={`/client/browse/${freelancerId}`} className="text-sm text-[#007BFF] font-body hover:underline mb-2 inline-block">
            ← Back to profile
          </Link>
          <h1 className="text-2xl font-heading font-bold text-neutral-900">
            {freelancer ? `Hire ${freelancer.full_name}` : 'Hire Freelancer'}
          </h1>
          {freelancer?.hourly_rate !== null && freelancer && (
            <p className="text-sm font-body text-neutral-500 mt-1">
              ${freelancer.hourly_rate}/hr
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Service */}
          <div>
            <label className="form-label" htmlFor="service">
              Service Needed <span className="text-red-500">*</span>
            </label>
            {freelancer && freelancer.services.length > 0 ? (
              <select id="service" className="form-input" {...register('service')}>
                <option value="">Select a service…</option>
                {freelancer.services.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="service"
                type="text"
                className="form-input"
                placeholder="e.g. Web Development"
                {...register('service')}
              />
            )}
            {errors.service && <p className="form-error">{errors.service.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="form-label" htmlFor="description">
              Project Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              rows={5}
              className="form-input resize-none"
              placeholder="Describe what you need in detail (minimum 20 characters)…"
              {...register('description')}
            />
            {errors.description && <p className="form-error">{errors.description.message}</p>}
          </div>

          {/* Timeline */}
          <div>
            <label className="form-label" htmlFor="timeline">
              Timeline <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <input
              id="timeline"
              type="text"
              className="form-input"
              placeholder='e.g. "2 weeks" or "ASAP"'
              {...register('timeline')}
            />
          </div>

          {/* Budget range */}
          <div>
            <label className="form-label" htmlFor="budget_range">
              Budget Range <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <input
              id="budget_range"
              type="text"
              className="form-input"
              placeholder='e.g. "$500–$1,000"'
              {...register('budget_range')}
            />
          </div>

          {/* Submit error */}
          {submitError && <p className="form-error">{submitError}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link href={`/client/browse/${freelancerId}`} className="btn-outline">
              Cancel
            </Link>
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send Hire Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
