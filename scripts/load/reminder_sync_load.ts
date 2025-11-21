/**
 * Simple load harness to simulate 30 days of reminders and sync cycles.
 * Usage: npx tsx scripts/load/reminder_sync_load.ts
 */
import { faker } from '@faker-js/faker';
import { Temporal } from '@js-temporal/polyfill';

type Reminder = {
  id: string;
  dueAt: Temporal.ZonedDateTime;
  recurrence: 'DAILY' | 'WEEKLY';
};

function generateReminders(count: number): Reminder[] {
  const now = Temporal.Now.zonedDateTimeISO();
  return Array.from({ length: count }).map((_, i) => ({
    id: `rem-${i}`,
    dueAt: now.add({ days: faker.number.int({ min: 0, max: 5 }) }),
    recurrence: faker.number.int({ min: 0, max: 1 }) === 0 ? 'DAILY' : 'WEEKLY'
  }));
}

function simulate(reminders: Reminder[], days: number) {
  let processed = 0;
  let dueCount = 0;
  const logs: string[] = [];

  for (let d = 0; d < days; d++) {
    const current = Temporal.Now.zonedDateTimeISO().add({ days: d });
    for (const r of reminders) {
      if (Temporal.ZonedDateTime.compare(r.dueAt, current) <= 0) {
        dueCount++;
        processed++;
        logs.push(`[${current.toPlainDate().toString()}] due ${r.id}`);
        const next = r.recurrence === 'DAILY' ? { days: 1 } : { days: 7 };
        r.dueAt = r.dueAt.add(next);
      }
    }
  }

  return { processed, dueCount, logs };
}

function main() {
  const reminders = generateReminders(100);
  const { processed, dueCount } = simulate(reminders, 30);
  console.log(`Simulated 30 days: processed=${processed}, dueCount=${dueCount}`);
}

main();
