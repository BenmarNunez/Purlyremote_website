// Index signature required for TypeScript compatibility with Supabase's UserAppMetadata type
type PartialUser = { app_metadata?: { role?: string; [key: string]: unknown } } | null

export function getRedirectPath(user: PartialUser, pathname: string): string | null {
  const role = user?.app_metadata?.role

  // Treat missing role same as unauthenticated — avoids /undefined/dashboard redirects
  if (!user || !role) {
    return pathname.startsWith('/auth') ? null : '/auth/login'
  }

  if (pathname.startsWith('/auth')) {
    return `/${role}/dashboard`
  }

  if (pathname.startsWith('/client') && role !== 'client') return `/${role}/dashboard`
  if (pathname.startsWith('/freelancer') && role !== 'freelancer') return `/${role}/dashboard`
  if (pathname.startsWith('/admin') && role !== 'admin') return `/${role}/dashboard`

  return null
}
