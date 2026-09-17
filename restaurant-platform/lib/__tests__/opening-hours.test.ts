import { describe, it, expect } from 'vitest'
import {
  parseTimeToMinutes,
  checkBranchOpenStatus,
  isBranchOpen,
} from '../opening-hours'

describe('Opening Hours Unit Tests', () => {
  it('parses 12-hour AM/PM and 24-hour time strings correctly', () => {
    expect(parseTimeToMinutes('10:00 AM')).toBe(600)
    expect(parseTimeToMinutes('12:00 PM')).toBe(720)
    expect(parseTimeToMinutes('02:30 PM')).toBe(870)
    expect(parseTimeToMinutes('12:00 AM')).toBe(0)
    expect(parseTimeToMinutes('01:15 AM')).toBe(75)
    expect(parseTimeToMinutes('23:45')).toBe(1425)
    expect(parseTimeToMinutes('00:30')).toBe(30)
  })

  it('correctly handles active/inactive branch flag', () => {
    const statusInactive = checkBranchOpenStatus({ open: '10:00 AM', close: '11:00 PM' }, false)
    expect(statusInactive.isOpen).toBe(false)
    expect(statusInactive.reason).toBe('الفرع غير مفعّل حالياً')

    const statusActive = checkBranchOpenStatus({ open: '10:00 AM', close: '11:00 PM' }, true, new Date('2026-09-16T14:00:00'))
    expect(statusActive.isOpen).toBe(true)
  })

  it('correctly validates daytime schedule (10:00 AM to 10:00 PM)', () => {
    const hours = { open: '10:00 AM', close: '10:00 PM' }

    // At 2:00 PM (14:00) -> Open
    const dateAt2PM = new Date('2026-09-16T14:00:00')
    const statusAt2PM = checkBranchOpenStatus(hours, true, dateAt2PM)
    expect(statusAt2PM.isOpen).toBe(true)

    // At 11:00 PM (23:00) -> Closed
    const dateAt11PM = new Date('2026-09-16T23:00:00')
    const statusAt11PM = checkBranchOpenStatus(hours, true, dateAt11PM)
    expect(statusAt11PM.isOpen).toBe(false)
    expect(statusAt11PM.reason).toContain('عذراً، الفرع مغلق حالياً')
  })

  it('correctly validates overnight schedule spanning midnight (11:00 AM to 02:00 AM)', () => {
    const overnightHours = { open: '11:00 AM', close: '02:00 AM' }

    // At 1:00 AM -> Open
    const dateAt1AM = new Date('2026-09-16T01:00:00')
    expect(checkBranchOpenStatus(overnightHours, true, dateAt1AM).isOpen).toBe(true)

    // At 3:00 AM -> Closed
    const dateAt3AM = new Date('2026-09-16T03:00:00')
    expect(checkBranchOpenStatus(overnightHours, true, dateAt3AM).isOpen).toBe(false)

    // At 8:00 PM -> Open
    const dateAt8PM = new Date('2026-09-16T20:00:00')
    expect(checkBranchOpenStatus(overnightHours, true, dateAt8PM).isOpen).toBe(true)
  })
})
