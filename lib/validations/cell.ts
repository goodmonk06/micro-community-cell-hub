import { z } from 'zod'

export const createCellSchema = z.object({
  communityId: z.string().min(1, 'Community ID is required'),
  key: z.string().min(1, 'Key is required').regex(/^[a-z0-9-]+$/, 'Key must be lowercase alphanumeric with hyphens'),
  name: z.string().min(1, 'Name is required'),
  descriptionMarkdown: z.string().optional(),
  themeTagsJson: z.string().optional(), // JSON string array
})

export const updateCellSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  descriptionMarkdown: z.string().optional(),
  themeTagsJson: z.string().optional(),
})

export type CreateCellInput = z.infer<typeof createCellSchema>
export type UpdateCellInput = z.infer<typeof updateCellSchema>
