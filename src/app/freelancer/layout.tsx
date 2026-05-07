import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import NotificationBell from '@/components/dashboard/NotificationBell'
import type { FreelancerProfile } from '@/lib/supabase/types'
import AvailabilityToggle from './AvailabilityToggle'

export default async function FreelancerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('freelancer_profiles')
    .select('full_name, avatar_url, availability')
    .eq('user_id', user.id)
    .single<Pick<FreelancerProfile, 'full_name' | 'avatar_url' | 'availability'>>()

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role="freelancer"
        user={{
          full_name: profile?.full_name ?? '',
          email: user.email ?? '',
          avatar_url: profile?.avatar_url,
        }}
      />
      <div className="flex-1 flex flex-col md:ml-60">
        <header className="flex items-center justify-between p-4 border-b border-neutral-200 bg-white sticky top-0 z-20">
          <AvailabilityToggle
            userId={user.id}
            initialAvailability={profile?.availability ?? true}
          />
          <NotificationBell userId={user.id} />
        </header>
        <main className="flex-1 bg-neutral-50 p-6">{children}</main>
      </div>
    </div>
  )
}
