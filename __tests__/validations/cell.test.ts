import { createCellSchema, updateCellSchema } from '@/lib/validations/cell'

describe('Cell Validation Schemas', () => {
  describe('createCellSchema', () => {
    it('should validate a valid cell creation payload', () => {
      const validData = {
        communityId: 'community-1',
        key: 'web-dev-study',
        name: 'Web Development Study Group',
        descriptionMarkdown: 'A community for learning web development',
        themeTagsJson: JSON.stringify(['javascript', 'react']),
      }

      const result = createCellSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject cell with invalid key format', () => {
      const invalidData = {
        communityId: 'community-1',
        key: 'Web Dev Study', // Invalid: contains spaces and uppercase
        name: 'Web Development Study Group',
      }

      const result = createCellSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject cell without required fields', () => {
      const invalidData = {
        key: 'web-dev-study',
        // Missing communityId and name
      }

      const result = createCellSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept cell without optional fields', () => {
      const validData = {
        communityId: 'community-1',
        key: 'web-dev-study',
        name: 'Web Development Study Group',
      }

      const result = createCellSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateCellSchema', () => {
    it('should validate a valid cell update payload', () => {
      const validData = {
        name: 'Updated Name',
        descriptionMarkdown: 'Updated description',
      }

      const result = updateCellSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept empty update payload', () => {
      const result = updateCellSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should reject update with empty name', () => {
      const invalidData = {
        name: '', // Empty name
      }

      const result = updateCellSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
