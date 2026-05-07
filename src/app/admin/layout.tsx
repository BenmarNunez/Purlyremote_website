import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import NotificationBell from '@/components/dashboard/NotificationBell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role="admin"
        user={{ full_name: 'Admin', email: user.email ?? '' }}
      />
      <div className="flex-1 flex flex-col md:ml-60">
        <header className="flex justify-end p-4 border-b border-gray-200 bg-white">
          <NotificationBell userId={user.id} />
        </header>
        <main className="flex-1 bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  )
}
