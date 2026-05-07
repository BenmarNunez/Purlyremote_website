import { adminClient } from '@/lib/supabase/admin'
import type { FreelancerProfile } from '@/lib/supabase/types'
import type { Metadata } from 'next'
import FreelancerTable from './FreelancerTable'

export const metadata: Metadata = { title: 'Freelancers — Admin — PurlyRemote' }

export default async function AdminFreelancersPage() {
  const { data: freelancersRaw } = await adminClient
    .from('freelancer_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const freelancers = (freelancersRaw ?? []) as FreelancerProfile[]

  return (
    <div>
      <div className="mb-6">
        <p className="section-tag mb-2">Management</p>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">Freelancers</h1>
        <p className="text-sm font-body text-neutral-500 mt-1">
          Review and manage freelancer profiles
        </p>
      </div>
      <FreelancerTable freelancers={freelancers} />
    </div>
  )
}
