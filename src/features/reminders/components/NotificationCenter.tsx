import * as Dialog from '@radix-ui/react-dialog';

import { useDueRemindersQuery, useMarkReminderSentMutation, useSnoozeReminderMutation } from '../hooks';
import { ReminderCard } from './ReminderCard';

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationCenter({ open, onOpenChange }: NotificationCenterProps) {
  const dueRemindersQuery = useDueRemindersQuery();
  const markSentMutation = useMarkReminderSentMutation();
  const snoozeMutation = useSnoozeReminderMutation();

  const handleSnooze = async (id: string) => {
    try {
      await snoozeMutation.mutateAsync({ id, snoozeMinutes: 15 });
    } catch (error) {
      console.error('Failed to snooze reminder', error);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await markSentMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to mark reminder as sent', error);
    }
  };

  const dueReminders = dueRemindersQuery.data ?? [];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Notifications
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </Dialog.Close>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {dueRemindersQuery.isLoading ? (
                <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Loading...
                </div>
              ) : dueReminders.length === 0 ? (
                <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                  No notifications
                </div>
              ) : (
                <div className="space-y-3">
                  {dueReminders.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onSnooze={handleSnooze}
                      onDismiss={handleDismiss}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

