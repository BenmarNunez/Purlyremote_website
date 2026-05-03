import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-neutral-bg section-padding">
      <div className="container-max">
        <div className="section-tag mb-4">Admin</div>
        <h1 className="section-title">Admin Dashboard</h1>
        <p className="section-subtitle mt-3">Phase 2 content coming soon.</p>
      </div>
    </div>
  )
}
