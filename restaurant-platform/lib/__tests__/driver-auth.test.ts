// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { signDriverToken, verifyDriverToken } from '../driver-auth'

describe('Driver Auth Unit Tests', () => {
  it('signs and verifies a valid driver JWT token', async () => {
    const payload = {
      id: 'usr_rider_101',
      userId: 'usr_rider_101',
      name: 'كابتن أحمد',
      role: 'rider',
      code: '101',
      restaurantId: 'rest_01',
      branchId: 'branch_01',
      status: 'online',
    }

    const token = await signDriverToken(payload)
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(20)

    const req = new Request('http://localhost/api/driver/orders', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const verified = await verifyDriverToken(req)
    expect(verified).not.toBeNull()
    expect(verified?.id).toBe('usr_rider_101')
    expect(verified?.role).toBe('rider')
    expect(verified?.code).toBe('101')
  })

  it('rejects invalid or missing authorization headers', async () => {
    const reqNoHeader = new Request('http://localhost/api/driver/orders')
    expect(await verifyDriverToken(reqNoHeader)).toBeNull()

    const reqBadHeader = new Request('http://localhost/api/driver/orders', {
      headers: { Authorization: 'Bearer invalid.jwt.token' },
    })
    expect(await verifyDriverToken(reqBadHeader)).toBeNull()
  })

  it('rejects tokens with unauthorized roles', async () => {
    const payload = {
      id: 'usr_customer_1',
      userId: 'usr_customer_1',
      name: 'عميل عادي',
      role: 'customer',
    }

    const token = await signDriverToken(payload)
    const req = new Request('http://localhost/api/driver/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })

    const verified = await verifyDriverToken(req)
    expect(verified).toBeNull()
  })
})
