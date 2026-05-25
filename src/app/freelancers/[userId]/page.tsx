import { adminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { FreelancerProfile } from '@/lib/supabase/types'

interface PageProps {
  params: Promise<{ userId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params
  const { data } = await adminClient
    .from('freelancer_profiles')
    .select('full_name, bio, expertise_area:skills')
    .eq('user_id', userId)
    .eq('approved', true)
    .single<{ full_name: string; bio: string | null }>()

  if (!data) return { title: 'Freelancer — PurlyRemote' }

  return {
    title: `${data.full_name} — PurlyRemote Freelancer`,
    description: data.bio ?? `${data.full_name} is a verified remote professional on Purly Remote.`,
    openGraph: {
      title: `${data.full_name} — PurlyRemote`,
      description: data.bio ?? `Hire ${data.full_name} on Purly Remote.`,
    },
  }
}

export default async function PublicFreelancerProfile({ params }: PageProps) {
  const { userId } = await params

  const { data: profile } = await adminClient
    .from('freelancer_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('approved', true)
    .single<FreelancerProfile>()

  if (!profile) notFound()

  const initials = profile.full_name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Nav */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4">
        <Link href="/" className="font-heading font-bold text-[#007BFF] text-lg">PurlyRemote</Link>
      </header>

      <main className="container-max section-padding">
        <div className="max-w-3xl mx-auto">
          {/* Profile header */}
          <div className="card p-8 mb-6">
            <div className="flex items-start gap-6 flex-wrap">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-24 h-24 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#007BFF] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-3xl font-heading font-semibold">{initials}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-heading font-bold text-neutral-900">{profile.full_name}</h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-body font-medium ${
                    profile.availability ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${profile.availability ? 'bg-green-500' : 'bg-neutral-400'}`} />
                    {profile.availability ? 'Available for Work' : 'Currently Unavailable'}
                  </span>
                  {profile.hourly_rate && (
                    <span className="text-sm font-body text-neutral-600">${profile.hourly_rate}/hr</span>
                  )}
                </div>
                {profile.bio && (
                  <p className="font-body text-neutral-600 mt-3 leading-relaxed">{profile.bio}</p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-neutral-100 flex gap-3 flex-wrap">
              <Link href={`/auth/register`} className="btn-primary">
                Hire {profile.full_name.split(' ')[0]}
              </Link>
              {profile.portfolio_url && (
                <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="btn-outline">
                  View Portfolio
                </a>
              )}
            </div>
          </div>

          {/* Skills */}
          {profile.skills.length > 0 && (
            <div className="card p-6 mb-6">
              <h2 className="font-heading font-semibold text-neutral-800 mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map(skill => (
                  <span key={skill} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-body bg-blue-50 text-[#007BFF] border border-blue-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {profile.services.length > 0 && (
            <div className="card p-6 mb-6">
              <h2 className="font-heading font-semibold text-neutral-800 mb-4">Services Offered</h2>
              <div className="flex flex-wrap gap-2">
                {profile.services.map(svc => (
                  <span key={svc} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-body bg-neutral-100 text-neutral-700">
                    {svc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="card p-6 bg-[#007BFF] text-white text-center">
            <h2 className="font-heading font-bold text-xl mb-2">Ready to work with {profile.full_name.split(' ')[0]}?</h2>
            <p className="font-body text-white/80 mb-4 text-sm">Create a free account and send a hire request in minutes.</p>
            <Link href="/auth/register" className="inline-block bg-white text-[#007BFF] font-body font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-50 transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
