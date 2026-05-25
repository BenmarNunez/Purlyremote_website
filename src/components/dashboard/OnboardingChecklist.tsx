'use client'

import Link from 'next/link'

interface ChecklistProps {
  profileCompleted: boolean
  approvalStatus: 'pending' | 'approved' | 'rejected'
  hasBio: boolean
  hasSkills: boolean
  hasServices: boolean
  hasRate: boolean
}

interface Step {
  id: string
  label: string
  done: boolean
  action?: string
  href: string
}

export default function OnboardingChecklist({
  profileCompleted,
  approvalStatus,
  hasBio,
  hasSkills,
  hasServices,
  hasRate,
}: ChecklistProps) {
  if (approvalStatus === 'approved') return null

  const steps: Step[] = [
    { id: 'bio', label: 'Add a bio to your profile', done: hasBio, href: '/freelancer/profile' },
    { id: 'skills', label: 'Add at least one skill', done: hasSkills, href: '/freelancer/profile' },
    { id: 'services', label: 'Select your services', done: hasServices, href: '/freelancer/profile' },
    { id: 'rate', label: 'Set your hourly rate', done: hasRate, href: '/freelancer/profile' },
    { id: 'submit', label: 'Submit profile for review', done: approvalStatus !== 'pending' || profileCompleted, href: '/freelancer/profile', action: 'Submit when profile is complete' },
  ]

  const doneCount = steps.filter(s => s.done).length
  const percent = Math.round((doneCount / steps.length) * 100)

  return (
    <div className="card p-6 border border-[#007BFF]/20 bg-blue-50/30">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading font-semibold text-neutral-900">Complete Your Profile</h2>
        <span className="text-sm font-body font-medium text-[#007BFF]">{percent}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-neutral-200 rounded-full mb-5 overflow-hidden">
        <div
          className="h-2 rounded-full bg-[#007BFF] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="space-y-2.5">
        {steps.map(step => (
          <Link key={step.id} href={step.href} className="flex items-center gap-3 group">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              step.done
                ? 'bg-[#007BFF] border-[#007BFF]'
                : 'border-neutral-300 group-hover:border-[#007BFF]'
            }`}>
              {step.done && (
                <svg width="10" height="8" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 10 8">
                  <path d="M1 4l2.5 2.5L9 1"/>
                </svg>
              )}
            </div>
            <span className={`text-sm font-body transition-colors ${
              step.done ? 'text-neutral-400 line-through' : 'text-neutral-700 group-hover:text-[#007BFF]'
            }`}>
              {step.label}
            </span>
          </Link>
        ))}
      </div>

      {profileCompleted && approvalStatus === 'pending' && (
        <div className="mt-4 pt-4 border-t border-blue-100">
          <p className="text-xs font-body text-neutral-500">
            ✅ Profile complete — head to <Link href="/freelancer/profile" className="text-[#007BFF] hover:underline font-medium">My Profile</Link> to submit for review.
          </p>
        </div>
      )}
    </div>
  )
}
