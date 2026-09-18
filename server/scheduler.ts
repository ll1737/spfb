export interface SchedulableTask {
  id: string;
  status: string;
  scheduledAt?: string;
}

export function selectDispatchableTasks<T extends SchedulableTask>(
  tasks: T[],
  now = Date.now(),
  availableSlots = Number.MAX_SAFE_INTEGER
): T[] {
  if (availableSlots <= 0) return [];

  return tasks
    .filter((task) => {
      if (task.status !== 'queued') return false;
      if (!task.scheduledAt) return true;
      const scheduledTime = Date.parse(task.scheduledAt);
      return Number.isFinite(scheduledTime) && scheduledTime <= now;
    })
    .slice(0, availableSlots);
}
