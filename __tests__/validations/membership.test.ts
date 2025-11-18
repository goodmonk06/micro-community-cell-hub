import { createMembershipSchema, updateMembershipSchema } from '@/lib/validations/membership'

describe('Membership Validation Schemas', () => {
  describe('createMembershipSchema', () => {
    it('should validate a valid membership creation payload', () => {
      const validData = {
        cellId: 'cell-123',
        memberId: 'user-456',
        role: 'MEMBER',
      }

      const result = createMembershipSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should default to MEMBER role when not specified', () => {
      const validData = {
        cellId: 'cell-123',
        memberId: 'user-456',
      }

      const result = createMembershipSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.role).toBe('MEMBER')
      }
    })

    it('should accept HOST and COHOST roles', () => {
      const hostData = {
        cellId: 'cell-123',
        memberId: 'user-456',
        role: 'HOST',
      }

      const cohostData = {
        cellId: 'cell-123',
        memberId: 'user-456',
        role: 'COHOST',
      }

      expect(createMembershipSchema.safeParse(hostData).success).toBe(true)
      expect(createMembershipSchema.safeParse(cohostData).success).toBe(true)
    })

    it('should reject invalid role', () => {
      const invalidData = {
        cellId: 'cell-123',
        memberId: 'user-456',
        role: 'ADMIN', // Invalid role
      }

      const result = createMembershipSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('updateMembershipSchema', () => {
    it('should validate role update', () => {
      const validData = {
        role: 'HOST',
      }

      const result = updateMembershipSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate leftAt update', () => {
      const validData = {
        leftAt: new Date().toISOString(),
      }

      const result = updateMembershipSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept empty update payload', () => {
      const result = updateMembershipSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })
})
