'use client'

import { useState } from 'react'

interface AvailabilityToggleProps {
  userId: string
  initialAvailability: boolean
}

export default function AvailabilityToggle({
  userId: _userId,
  initialAvailability,
}: AvailabilityToggleProps) {
  const [available, setAvailable] = useState(initialAvailability)
  const [saving, setSaving] = useState(false)

  async function handleToggle() {
    const next = !available
    setAvailable(next)
    setSaving(true)
    try {
      await fetch('/api/freelancer-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: next }),
      })
    } catch {
      // revert optimistic update on error
      setAvailable(!next)
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={saving}
      aria-pressed={available}
      className="flex items-center gap-2 group select-none"
    >
      {/* Track */}
      <span
        className={[
          'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
          available ? 'bg-[#007BFF]' : 'bg-neutral-300',
          saving ? 'opacity-60 cursor-not-allowed' : '',
        ].join(' ')}
      >
        {/* Thumb */}
        <span
          className={[
            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out',
            available ? 'translate-x-4' : 'translate-x-0',
          ].join(' ')}
        />
      </span>
      <span className="text-sm font-body font-medium text-neutral-700 group-hover:text-neutral-900">
        {available ? 'Available for Work' : 'Unavailable'}
      </span>
    </button>
  )
}
