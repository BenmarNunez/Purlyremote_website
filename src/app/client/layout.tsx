import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ClientProfile } from '@/lib/supabase/types'
import Sidebar from '@/components/dashboard/Sidebar'
import NotificationBell from '@/components/dashboard/NotificationBell'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('client_profiles')
    .select('full_name, avatar_url')
    .eq('user_id', user.id)
    .single<Pick<ClientProfile, 'full_name' | 'avatar_url'>>()

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role="client"
        user={{
          full_name: profile?.full_name ?? '',
          email: user.email ?? '',
          avatar_url: profile?.avatar_url,
        }}
      />
      <div className="flex-1 flex flex-col md:ml-60">
        <header className="flex justify-end p-4 border-b border-neutral-200 bg-white">
          <NotificationBell userId={user.id} />
        </header>
        <main className="flex-1 bg-neutral-50 p-6">{children}</main>
      </div>
    </div>
  )
}
