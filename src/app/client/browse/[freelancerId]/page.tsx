import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { FreelancerProfile } from '@/lib/supabase/types'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ freelancerId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { freelancerId } = await params
  return { title: `Freelancer Profile — PurlyRemote`, description: `View profile ${freelancerId}` }
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="w-24 h-24 rounded-full bg-[#007BFF] flex items-center justify-center flex-shrink-0">
      <span className="text-white font-heading font-bold text-3xl">{initials}</span>
    </div>
  )
}

export default async function FreelancerProfilePage({ params }: Props) {
  const { freelancerId } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data, error } = await supabase
    .from('freelancer_profiles')
    .select('*')
    .eq('user_id', freelancerId)
    .eq('approved', true)
    .single()

  if (error || !data) notFound()

  const freelancer = data as FreelancerProfile

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center mb-6">
          {freelancer.avatar_url ? (
            <img
              src={freelancer.avatar_url}
              alt={freelancer.full_name}
              className="w-24 h-24 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <InitialsAvatar name={freelancer.full_name} />
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-heading font-bold text-neutral-900 mb-1">
              {freelancer.full_name}
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              {freelancer.hourly_rate !== null && (
                <span className="text-sm font-body text-neutral-500">
                  ${freelancer.hourly_rate}/hr
                </span>
              )}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium ${
                  freelancer.availability
                    ? 'bg-green-100 text-green-700'
                    : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {freelancer.availability ? 'Available' : 'Busy'}
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {freelancer.bio && (
          <div className="mb-6">
            <h2 className="font-heading font-semibold text-neutral-700 mb-2">About</h2>
            <p className="font-body text-neutral-600 text-sm leading-relaxed">{freelancer.bio}</p>
          </div>
        )}

        {/* Skills */}
        {freelancer.skills.length > 0 && (
          <div className="mb-6">
            <h2 className="font-heading font-semibold text-neutral-700 mb-2">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {freelancer.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full text-sm font-body bg-blue-50 text-[#007BFF] border border-blue-100"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        {freelancer.services.length > 0 && (
          <div className="mb-6">
            <h2 className="font-heading font-semibold text-neutral-700 mb-2">Services Offered</h2>
            <div className="flex flex-wrap gap-2">
              {freelancer.services.map((service) => (
                <span
                  key={service}
                  className="px-3 py-1 rounded-full text-sm font-body bg-neutral-100 text-neutral-700 border border-neutral-200"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio */}
        {freelancer.portfolio_url && (
          <div className="mb-6">
            <h2 className="font-heading font-semibold text-neutral-700 mb-2">Portfolio</h2>
            <a
              href={freelancer.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#007BFF] font-body text-sm hover:underline break-all"
            >
              {freelancer.portfolio_url}
            </a>
          </div>
        )}

        {/* CTA */}
        <div className="pt-2 border-t border-neutral-100 mt-4 flex gap-3">
          <Link href="/client/browse" className="btn-outline">
            Back
          </Link>
          <Link href={`/client/hire/${freelancerId}`} className="btn-primary">
            Hire This Freelancer
          </Link>
        </div>
      </div>
    </div>
  )
}
