import { describe, expect, it } from 'vitest'
import { detectScheduleConflict, selectActiveSchedule } from '@shared/scheduler'

describe('scheduler helpers', () => {
  it('memilih schedule dengan priority tertinggi', () => {
    const selected = selectActiveSchedule(
      [
        { id: 'b', startAt: '2026-07-22T08:00:00.000Z', endAt: '2026-07-22T10:00:00.000Z', priority: 100, enabled: true },
        { id: 'a', startAt: '2026-07-22T08:00:00.000Z', endAt: '2026-07-22T10:00:00.000Z', priority: 200, enabled: true },
      ],
      '2026-07-22T08:30:00.000Z',
    )

    expect(selected?.id).toBe('a')
  })

  it('mendeteksi conflict antar schedule aktif', () => {
    const hasConflict = detectScheduleConflict(
      { id: '1', startAt: '2026-07-22T08:00:00.000Z', endAt: '2026-07-22T10:00:00.000Z', enabled: true },
      [{ id: '2', startAt: '2026-07-22T09:00:00.000Z', endAt: '2026-07-22T11:00:00.000Z', enabled: true }],
    )

    expect(hasConflict).toBe(true)
  })

  it('menggunakan start terbaru bila priority sama', () => {
    const selected = selectActiveSchedule(
      [
        { id: 'older', startAt: '2026-07-22T08:00:00.000Z', endAt: '2026-07-22T12:00:00.000Z', priority: 100, enabled: true },
        { id: 'newer', startAt: '2026-07-22T09:00:00.000Z', endAt: '2026-07-22T12:00:00.000Z', priority: 100, enabled: true },
      ],
      '2026-07-22T10:00:00.000Z',
    )

    expect(selected?.id).toBe('newer')
  })
})
