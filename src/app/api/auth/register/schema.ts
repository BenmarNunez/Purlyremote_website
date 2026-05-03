import { z } from 'zod'

const clientBase = z.object({
  role: z.literal('client'),
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  company_name: z.string().optional(),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
})

const freelancerBase = z.object({
  role: z.literal('freelancer'),
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  expertise_area: z.string().min(2, 'Please select your expertise'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
})

// Named exports for react-hook-form zodResolver usage (refined per-role schemas)
export const clientSchema = clientBase.refine(
  d => d.password === d.confirm_password,
  { message: 'Passwords do not match', path: ['confirm_password'] },
)

export const freelancerSchema = freelancerBase.refine(
  d => d.password === d.confirm_password,
  { message: 'Passwords do not match', path: ['confirm_password'] },
)

// registerSchema uses discriminatedUnion on the base objects (required by Zod — ZodEffects
// from .refine() cannot be used as discriminated union members), then applies password-match
// validation via superRefine so the combined schema still rejects mismatches.
export const registerSchema = z
  .discriminatedUnion('role', [clientBase, freelancerBase])
  .superRefine((data, ctx) => {
    if (data.password !== data.confirm_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirm_password'],
      })
    }
  })

export type RegisterInput = z.infer<typeof registerSchema>
export type ClientInput = z.infer<typeof clientSchema>
export type FreelancerInput = z.infer<typeof freelancerSchema>
