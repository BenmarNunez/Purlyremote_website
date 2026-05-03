import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Client Dashboard' }

export default function ClientDashboard() {
  return (
    <div className="min-h-screen bg-neutral-bg section-padding">
      <div className="container-max">
        <div className="section-tag mb-4">Client</div>
        <h1 className="section-title">Client Dashboard</h1>
        <p className="section-subtitle mt-3">Phase 2 content coming soon.</p>
      </div>
    </div>
  )
}
