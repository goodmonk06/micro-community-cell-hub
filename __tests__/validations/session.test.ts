import { createSessionSchema, updateSessionSchema } from '@/lib/validations/session'

describe('Session Validation Schemas', () => {
  describe('createSessionSchema', () => {
    it('should validate a valid session creation payload', () => {
      const validData = {
        cellId: 'cell-123',
        ts: new Date().toISOString(),
        sessionType: 'CIRCLE',
        attendanceCount: 10,
        notesMarkdown: 'Great discussion on React patterns',
      }

      const result = createSessionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should default to OTHER session type when not specified', () => {
      const validData = {
        cellId: 'cell-123',
      }

      const result = createSessionSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sessionType).toBe('OTHER')
        expect(result.data.attendanceCount).toBe(0)
      }
    })

    it('should accept all valid session types', () => {
      const types = ['CIRCLE', 'STUDY', 'PROJECT', 'OTHER']

      types.forEach(type => {
        const data = {
          cellId: 'cell-123',
          sessionType: type,
        }
        expect(createSessionSchema.safeParse(data).success).toBe(true)
      })
    })

    it('should reject invalid session type', () => {
      const invalidData = {
        cellId: 'cell-123',
        sessionType: 'MEETING', // Invalid type
      }

      const result = createSessionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative attendance count', () => {
      const invalidData = {
        cellId: 'cell-123',
        attendanceCount: -5,
      }

      const result = createSessionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('updateSessionSchema', () => {
    it('should validate session update payload', () => {
      const validData = {
        sessionType: 'STUDY',
        attendanceCount: 15,
        notesMarkdown: 'Updated notes',
      }

      const result = updateSessionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept empty update payload', () => {
      const result = updateSessionSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })
})
