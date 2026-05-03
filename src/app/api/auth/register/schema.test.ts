import { describe, it, expect } from 'vitest'
import { registerSchema, clientSchema, freelancerSchema } from './schema'

describe('registerSchema', () => {
  it('rejects unknown roles (discriminatedUnion falls through)', () => {
    const result = registerSchema.safeParse({
      role: 'admin',
      full_name: 'Evil Admin',
      email: 'admin@evil.com',
      password: 'password123',
      confirm_password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('validates valid client registration', () => {
    const result = registerSchema.safeParse({
      role: 'client',
      full_name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirm_password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('accepts client with optional company_name', () => {
    const result = registerSchema.safeParse({
      role: 'client',
      full_name: 'John Doe',
      company_name: 'Acme Corp',
      email: 'john@example.com',
      password: 'password123',
      confirm_password: 'password123',
    })
    expect(result.success).toBe(true)
    if (result.success && result.data.role === 'client') {
      expect(result.data.company_name).toBe('Acme Corp')
    }
  })

  it('rejects client with mismatched passwords', () => {
    const result = registerSchema.safeParse({
      role: 'client',
      full_name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirm_password: 'different',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      expect(errors.confirm_password).toContain('Passwords do not match')
    }
  })

  it('validates valid freelancer registration', () => {
    const result = registerSchema.safeParse({
      role: 'freelancer',
      full_name: 'Jane Doe',
      expertise_area: 'Software Development',
      email: 'jane@example.com',
      password: 'password123',
      confirm_password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects freelancer without expertise_area', () => {
    const result = registerSchema.safeParse({
      role: 'freelancer',
      full_name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
      confirm_password: 'password123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.expertise_area).toBeDefined()
    }
  })

  it('rejects whitespace-only full_name', () => {
    const result = registerSchema.safeParse({
      role: 'client',
      full_name: '   ',
      email: 'john@example.com',
      password: 'password123',
      confirm_password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects freelancer with mismatched passwords', () => {
    const result = registerSchema.safeParse({
      role: 'freelancer',
      full_name: 'Jane Doe',
      expertise_area: 'Design',
      email: 'jane@example.com',
      password: 'password123',
      confirm_password: 'mismatch',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      expect(errors.confirm_password).toContain('Passwords do not match')
    }
  })

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      role: 'client',
      full_name: 'John Doe',
      email: 'john@example.com',
      password: 'short',
      confirm_password: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      role: 'client',
      full_name: 'John Doe',
      email: 'not-an-email',
      password: 'password123',
      confirm_password: 'password123',
    })
    expect(result.success).toBe(false)
  })
})

describe('clientSchema (used directly by react-hook-form zodResolver)', () => {
  it('rejects mismatched passwords', () => {
    const result = clientSchema.safeParse({
      role: 'client',
      full_name: 'John Doe',
      email: 'john@example.com',
      password: 'pass1234',
      confirm_password: 'other',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirm_password).toContain('Passwords do not match')
    }
  })

  it('accepts valid client data', () => {
    const result = clientSchema.safeParse({
      role: 'client',
      full_name: 'John Doe',
      email: 'john@example.com',
      password: 'pass1234',
      confirm_password: 'pass1234',
    })
    expect(result.success).toBe(true)
  })
})

describe('freelancerSchema (used directly by react-hook-form zodResolver)', () => {
  it('rejects mismatched passwords', () => {
    const result = freelancerSchema.safeParse({
      role: 'freelancer',
      full_name: 'Jane Doe',
      expertise_area: 'Design',
      email: 'jane@example.com',
      password: 'pass1234',
      confirm_password: 'other',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirm_password).toContain('Passwords do not match')
    }
  })

  it('requires expertise_area', () => {
    const result = freelancerSchema.safeParse({
      role: 'freelancer',
      full_name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'pass1234',
      confirm_password: 'pass1234',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.expertise_area).toBeDefined()
    }
  })
})
