import type { MetadataRoute } from 'next'
import { adminClient } from '@/lib/supabase/admin'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purlyremote.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/hire`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/apply`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  try {
    const { data } = await adminClient
      .from('freelancer_profiles')
      .select('user_id, created_at')
      .eq('approved', true)
      .limit(1000)

    const dynamic: MetadataRoute.Sitemap = (data ?? []).map(p => ({
      url: `${BASE}/freelancers/${p.user_id}`,
      lastModified: new Date(p.created_at as string),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
    return [...staticRoutes, ...dynamic]
  } catch {
    return staticRoutes
  }
}
