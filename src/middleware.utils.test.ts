import { describe, it, expect } from 'vitest'
import { getRedirectPath } from './middleware.utils'

const makeUser = (role: string) => ({ app_metadata: { role } })

describe('getRedirectPath', () => {
  it('returns /auth/login for unauthenticated user on protected route', () => {
    expect(getRedirectPath(null, '/client/dashboard')).toBe('/auth/login')
    expect(getRedirectPath(null, '/freelancer/dashboard')).toBe('/auth/login')
    expect(getRedirectPath(null, '/admin/dashboard')).toBe('/auth/login')
  })

  it('returns null for unauthenticated user on /auth routes', () => {
    expect(getRedirectPath(null, '/auth/login')).toBeNull()
    expect(getRedirectPath(null, '/auth/register')).toBeNull()
  })

  it('redirects authenticated user away from /auth routes to their dashboard', () => {
    expect(getRedirectPath(makeUser('client'), '/auth/login')).toBe('/client/dashboard')
    expect(getRedirectPath(makeUser('freelancer'), '/auth/register')).toBe('/freelancer/dashboard')
    expect(getRedirectPath(makeUser('admin'), '/auth/login')).toBe('/admin/dashboard')
  })

  it('returns null when role matches route prefix', () => {
    expect(getRedirectPath(makeUser('client'), '/client/dashboard')).toBeNull()
    expect(getRedirectPath(makeUser('freelancer'), '/freelancer/profile')).toBeNull()
    expect(getRedirectPath(makeUser('admin'), '/admin/freelancers')).toBeNull()
  })

  it('redirects wrong-role user to their own dashboard', () => {
    expect(getRedirectPath(makeUser('freelancer'), '/client/dashboard')).toBe('/freelancer/dashboard')
    expect(getRedirectPath(makeUser('client'), '/admin/dashboard')).toBe('/client/dashboard')
    expect(getRedirectPath(makeUser('admin'), '/freelancer/profile')).toBe('/admin/dashboard')
  })

  it('handles deeply nested paths', () => {
    expect(getRedirectPath(null, '/client/settings/billing')).toBe('/auth/login')
    expect(getRedirectPath(makeUser('client'), '/client/settings/billing')).toBeNull()
  })

  it('treats user with missing role as unauthenticated (no /undefined/dashboard)', () => {
    expect(getRedirectPath({ app_metadata: {} }, '/client/dashboard')).toBe('/auth/login')
    expect(getRedirectPath({ app_metadata: {} }, '/auth/login')).toBeNull()
  })
})
