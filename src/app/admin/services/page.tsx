'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ServiceCatalog } from '@/lib/supabase/types'

interface FormState {
  name: string
  icon: string
  description: string
}

const EMPTY_FORM: FormState = { name: '', icon: '', description: '' }

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceCatalog[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/services')
      if (!res.ok) return
      const data: ServiceCatalog[] = await res.json()
      setServices(data)
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  async function handleToggle(service: ServiceCatalog) {
    setToggling(service.id)
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !service.active }),
      })
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, active: !s.active } : s))
        )
      }
    } finally {
      setToggling(null)
    }
  }

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!form.name.trim() || !form.icon.trim() || !form.description.trim()) {
      setFormError('All fields are required.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setFormError(data.error ?? 'Failed to add service.')
        return
      }

      setForm(EMPTY_FORM)
      await fetchServices()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <p className="section-tag mb-2">Management</p>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">Service Catalog</h1>
        <p className="text-sm font-body text-neutral-500 mt-1">
          Manage services shown to clients
        </p>
      </div>

      {/* Add service form */}
      <div className="card p-6 mb-6">
        <h2 className="font-heading font-semibold text-neutral-800 mb-4">Add New Service</h2>
        <form onSubmit={handleAddService} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label" htmlFor="svc-name">
                Service Name
              </label>
              <input
                id="svc-name"
                type="text"
                className="form-input"
                placeholder="e.g. Web Development"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="svc-icon">
                Icon (emoji)
              </label>
              <input
                id="svc-icon"
                type="text"
                className="form-input"
                placeholder="e.g. 💻"
                value={form.icon}
                onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="svc-description">
              Description
            </label>
            <textarea
              id="svc-description"
              className="form-input resize-none"
              rows={3}
              placeholder="Brief description of the service..."
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {formError && <p className="form-error">{formError}</p>}

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Adding…' : 'Add Service'}
            </button>
          </div>
        </form>
      </div>

      {/* Services list */}
      {loading ? (
        <div className="card px-6 py-10 text-center">
          <p className="font-body text-neutral-400 text-sm">Loading services…</p>
        </div>
      ) : services.length === 0 ? (
        <div className="card px-6 py-10 text-center">
          <p className="font-body text-neutral-500 text-sm">No services yet. Add one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((svc) => (
            <div
              key={svc.id}
              className={[
                'card p-5 transition-opacity',
                !svc.active ? 'opacity-60' : '',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" role="img" aria-label={svc.name}>
                    {svc.icon}
                  </span>
                  <div>
                    <h3 className="font-heading font-semibold text-neutral-800 text-sm">
                      {svc.name}
                    </h3>
                    <span
                      className={[
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-medium mt-0.5',
                        svc.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-neutral-100 text-neutral-500',
                      ].join(' ')}
                    >
                      {svc.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => handleToggle(svc)}
                  disabled={toggling === svc.id}
                  className={[
                    'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50',
                    svc.active ? 'bg-[#007BFF]' : 'bg-neutral-300',
                  ].join(' ')}
                  role="switch"
                  aria-checked={svc.active}
                  aria-label={`Toggle ${svc.name}`}
                >
                  <span
                    className={[
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      svc.active ? 'translate-x-5' : 'translate-x-0',
                    ].join(' ')}
                  />
                </button>
              </div>

              <p className="text-sm font-body text-neutral-600 leading-snug line-clamp-3">
                {svc.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
