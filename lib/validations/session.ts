import { z } from 'zod'

export const createSessionSchema = z.object({
  cellId: z.string().min(1, 'Cell ID is required'),
  ts: z.string().datetime().optional(),
  sessionType: z.enum(['CIRCLE', 'STUDY', 'PROJECT', 'OTHER']).default('OTHER'),
  attendanceCount: z.number().int().min(0).default(0),
  notesMarkdown: z.string().optional(),
  metaJson: z.string().optional(),
})

export const updateSessionSchema = z.object({
  ts: z.string().datetime().optional(),
  sessionType: z.enum(['CIRCLE', 'STUDY', 'PROJECT', 'OTHER']).optional(),
  attendanceCount: z.number().int().min(0).optional(),
  notesMarkdown: z.string().optional(),
  metaJson: z.string().optional(),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>
