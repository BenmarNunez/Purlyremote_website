import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MessageModeration from './MessageModeration'

export default async function AdminMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') redirect('/auth/login')

  return (
    <div>
      <div className="mb-6">
        <div className="section-tag mb-2">Moderation</div>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">Message Moderation</h1>
        <p className="text-sm font-body text-neutral-500 mt-1">Search platform messages and remove abuse.</p>
      </div>
      <MessageModeration />
    </div>
  )
}
