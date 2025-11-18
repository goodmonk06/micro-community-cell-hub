import { z } from 'zod'

export const createMembershipSchema = z.object({
  cellId: z.string().min(1, 'Cell ID is required'),
  memberId: z.string().min(1, 'Member ID is required'),
  role: z.enum(['MEMBER', 'HOST', 'COHOST']).default('MEMBER'),
})

export const updateMembershipSchema = z.object({
  role: z.enum(['MEMBER', 'HOST', 'COHOST']).optional(),
  leftAt: z.string().datetime().optional().nullable(),
})

export type CreateMembershipInput = z.infer<typeof createMembershipSchema>
export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>
