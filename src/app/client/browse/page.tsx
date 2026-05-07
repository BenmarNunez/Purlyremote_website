'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { FreelancerProfile, ServiceCatalog } from '@/lib/supabase/types'

// ─── Avatar helper ───────────────────────────────────────────────────────────

function Avatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-14 h-14 rounded-full object-cover flex-shrink-0"
      />
    )
  }

  return (
    <div className="w-14 h-14 rounded-full bg-[#007BFF] flex items-center justify-center flex-shrink-0">
      <span className="text-white font-heading font-semibold text-lg">{initials}</span>
    </div>
  )
}

// ─── Match badge ─────────────────────────────────────────────────────────────

function MatchBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
        ⭐ Best Match
      </span>
    )
  if (rank <= 3)
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-semibold bg-neutral-100 text-neutral-600 border border-neutral-300">
        Great Match
      </span>
    )
  return null
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScoredFreelancer extends FreelancerProfile {
  matchScore: number
}

interface WizardState {
  service: string
  budget: string
  timeline: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BrowsePage() {
  const [services, setServices] = useState<ServiceCatalog[]>([])
  const [freelancers, setFreelancers] = useState<ScoredFreelancer[]>([])
  const [loading, setLoading] = useState(true)
  const [filterService, setFilterService] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [wizard, setWizard] = useState<WizardState>({ service: '', budget: '', timeline: '' })
  const [wizardRan, setWizardRan] = useState(false)
  const [rankedIds, setRankedIds] = useState<Map<string, number>>(new Map())

  // Load services on mount
  useEffect(() => {
    async function loadServices() {
      const supabase = createClient()
      const { data } = await supabase
        .from('services_catalog')
        .select('*')
        .eq('active', true)
        .order('name')
      setServices((data ?? []) as ServiceCatalog[])
    }
    loadServices()
  }, [])

  // Load freelancers whenever filters change
  const fetchFreelancers = useCallback(async (service: string, search: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (service) params.set('service', service)
      if (search) params.set('search', search)
      const res = await fetch(`/api/freelancers?${params.toString()}`)
      if (!res.ok) return
      const data = (await res.json()) as FreelancerProfile[]
      setFreelancers(data.map((f) => ({ ...f, matchScore: 0 })))
      setWizardRan(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFreelancers(filterService, filterSearch)
  }, [filterService, filterSearch, fetchFreelancers])

  function handleSearch() {
    setFilterSearch(searchInput)
  }

  // ── Wizard submit ────────────────────────────────────────────────────────

  function runWizard() {
    const budget = parseFloat(wizard.budget) || Infinity
    const scored = freelancers
      .map((f): ScoredFreelancer => {
        let score = 0
        if (wizard.service && f.services.includes(wizard.service)) score += 3
        if (f.availability) score += 2
        if (f.hourly_rate !== null && f.hourly_rate <= budget) score += 1
        return { ...f, matchScore: score }
      })
      .sort((a, b) => b.matchScore - a.matchScore)

    setFreelancers(scored)

    const rankMap = new Map<string, number>()
    scored.forEach((f, i) => {
      if (i < 3) rankMap.set(f.user_id, i + 1)
    })
    setRankedIds(rankMap)
    setWizardRan(true)
    setWizardOpen(false)
  }

  const maxScore = Math.max(...freelancers.map((f) => f.matchScore), 1)

  return (
    <div>
      <div className="mb-6">
        <p className="section-tag mb-2">Talent</p>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">Browse Freelancers</h1>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="form-label">Service</label>
          <select
            className="form-input"
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
          >
            <option value="">All services</option>
            {services.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="form-label">Search</label>
          <input
            type="text"
            className="form-input"
            placeholder="Name or keyword…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <button className="btn-primary" onClick={handleSearch}>
          Search
        </button>
      </div>

      {/* ── Find My Match wizard ────────────────────────────────────────────── */}
      <div className="card mb-6 overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
          onClick={() => setWizardOpen((v) => !v)}
        >
          <span className="font-heading font-semibold text-neutral-800">
            Find My Match
            <span className="ml-2 text-xs font-body font-normal text-neutral-500">
              — let us score the best fit for you
            </span>
          </span>
          <svg
            className={`w-5 h-5 text-neutral-400 transition-transform ${wizardOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {wizardOpen && (
          <div className="border-t border-neutral-100 px-5 py-5">
            {wizardStep === 1 && (
              <div className="space-y-4">
                <p className="font-body text-sm text-neutral-600">
                  Step 1 of 3 — What service do you need?
                </p>
                <select
                  className="form-input max-w-sm"
                  value={wizard.service}
                  onChange={(e) => setWizard((w) => ({ ...w, service: e.target.value }))}
                >
                  <option value="">Select a service</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  className="btn-primary"
                  disabled={!wizard.service}
                  onClick={() => setWizardStep(2)}
                >
                  Next
                </button>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <p className="font-body text-sm text-neutral-600">
                  Step 2 of 3 — What is your budget? ($/hr)
                </p>
                <input
                  type="number"
                  min={0}
                  className="form-input max-w-xs"
                  placeholder="e.g. 50"
                  value={wizard.budget}
                  onChange={(e) => setWizard((w) => ({ ...w, budget: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button className="btn-outline" onClick={() => setWizardStep(1)}>
                    Back
                  </button>
                  <button className="btn-primary" onClick={() => setWizardStep(3)}>
                    Next
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-4">
                <p className="font-body text-sm text-neutral-600">
                  Step 3 of 3 — What is your timeline?
                </p>
                <input
                  type="text"
                  className="form-input max-w-xs"
                  placeholder='e.g. "2 weeks"'
                  value={wizard.timeline}
                  onChange={(e) => setWizard((w) => ({ ...w, timeline: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button className="btn-outline" onClick={() => setWizardStep(2)}>
                    Back
                  </button>
                  <button className="btn-primary" onClick={runWizard}>
                    Find Matches
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Freelancer grid ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse space-y-3">
              <div className="flex gap-3 items-center">
                <div className="w-14 h-14 rounded-full bg-neutral-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-neutral-200 rounded w-full" />
              <div className="h-3 bg-neutral-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : freelancers.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-body text-neutral-500">No freelancers found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {freelancers.map((freelancer) => {
            const rank = rankedIds.get(freelancer.user_id)
            const scorePercent =
              wizardRan && maxScore > 0
                ? Math.round((freelancer.matchScore / maxScore) * 100)
                : 0

            return (
              <div
                key={freelancer.user_id}
                className={`card card-hover p-5 flex flex-col gap-3 ${rank === 1 ? 'ring-2 ring-yellow-400' : ''}`}
              >
                {/* Top row */}
                <div className="flex items-start gap-3">
                  <Avatar name={freelancer.full_name} avatarUrl={freelancer.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-semibold text-neutral-900 truncate">
                      {freelancer.full_name}
                    </h3>
                    {freelancer.hourly_rate !== null && (
                      <p className="text-sm font-body text-neutral-500">
                        ${freelancer.hourly_rate}/hr
                      </p>
                    )}
                    {wizardRan && rank && <MatchBadge rank={rank} />}
                  </div>
                  {/* Availability badge */}
                  <span
                    className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-medium ${
                      freelancer.availability
                        ? 'bg-green-100 text-green-700'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {freelancer.availability ? 'Available' : 'Busy'}
                  </span>
                </div>

                {/* Skills */}
                {freelancer.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {freelancer.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-full text-xs font-body bg-blue-50 text-[#007BFF] border border-blue-100"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Match score bar */}
                {wizardRan && (
                  <div>
                    <div className="flex justify-between text-xs font-body text-neutral-400 mb-1">
                      <span>Match score</span>
                      <span>{scorePercent}%</span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#007BFF] rounded-full transition-all duration-500"
                        style={{ width: `${scorePercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-1">
                  <Link
                    href={`/client/browse/${freelancer.user_id}`}
                    className="btn-outline flex-1 text-center text-sm"
                  >
                    View Profile
                  </Link>
                  <Link
                    href={`/client/hire/${freelancer.user_id}`}
                    className="btn-primary flex-1 text-center text-sm"
                  >
                    Hire
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
