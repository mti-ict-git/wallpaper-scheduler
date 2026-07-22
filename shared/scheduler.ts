import type { ScheduleRecord } from '@shared/contracts'

type MinimalSchedule = Pick<ScheduleRecord, 'id' | 'startAt' | 'endAt' | 'priority' | 'enabled'>

export function selectActiveSchedule<T extends MinimalSchedule>(
  schedules: T[],
  nowIso: string,
): T | null {
  const now = new Date(nowIso).getTime()

  return [...schedules]
    .filter((schedule) => {
      if (!schedule.enabled) {
        return false
      }

      const start = new Date(schedule.startAt).getTime()
      const end = schedule.endAt ? new Date(schedule.endAt).getTime() : Number.POSITIVE_INFINITY

      return start <= now && now < end
    })
    .sort((left, right) => {
      if (right.priority !== left.priority) {
        return right.priority - left.priority
      }

      const startDiff = new Date(right.startAt).getTime() - new Date(left.startAt).getTime()
      if (startDiff !== 0) {
        return startDiff
      }

      return left.id.localeCompare(right.id)
    })[0] ?? null
}

export function detectScheduleConflict<T extends Pick<ScheduleRecord, 'id' | 'startAt' | 'endAt' | 'enabled'>>(
  candidate: T,
  existingSchedules: T[],
) {
  if (!candidate.enabled) {
    return false
  }

  const candidateStart = new Date(candidate.startAt).getTime()
  const candidateEnd = candidate.endAt ? new Date(candidate.endAt).getTime() : Number.POSITIVE_INFINITY

  return existingSchedules.some((schedule) => {
    if (!schedule.enabled || schedule.id === candidate.id) {
      return false
    }

    const scheduleStart = new Date(schedule.startAt).getTime()
    const scheduleEnd = schedule.endAt ? new Date(schedule.endAt).getTime() : Number.POSITIVE_INFINITY

    return candidateStart < scheduleEnd && scheduleStart < candidateEnd
  })
}
