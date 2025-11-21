import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createReminder,
  deleteReminder,
  fetchDueReminders,
  fetchReminder,
  fetchReminders,
  markReminderSent,
  snoozeReminder,
  updateReminder
} from './api';

const remindersKey = ['reminders'] as const;
const reminderKey = (id: string) => ['reminders', id] as const;
const dueRemindersKey = ['reminders', 'due'] as const;

export function useRemindersQuery() {
  return useQuery({
    queryKey: remindersKey,
    queryFn: fetchReminders,
    staleTime: 1000 * 30
  });
}

export function useReminderQuery(id: string) {
  return useQuery({
    queryKey: reminderKey(id),
    queryFn: () => fetchReminder(id),
    enabled: !!id,
    staleTime: 1000 * 30
  });
}

export function useDueRemindersQuery() {
  return useQuery({
    queryKey: dueRemindersKey,
    queryFn: fetchDueReminders,
    staleTime: 1000 * 10, // Refresh more frequently for due reminders
    refetchInterval: 1000 * 60 // Refetch every minute
  });
}

export function useCreateReminderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReminder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: remindersKey });
      await queryClient.invalidateQueries({ queryKey: dueRemindersKey });
    }
  });
}

export function useUpdateReminderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateReminder,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: remindersKey });
      await queryClient.invalidateQueries({ queryKey: reminderKey(data.id) });
      await queryClient.invalidateQueries({ queryKey: dueRemindersKey });
    }
  });
}

export function useDeleteReminderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteReminder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: remindersKey });
      await queryClient.invalidateQueries({ queryKey: dueRemindersKey });
    }
  });
}

export function useSnoozeReminderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: snoozeReminder,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: remindersKey });
      await queryClient.invalidateQueries({ queryKey: reminderKey(data.id) });
      await queryClient.invalidateQueries({ queryKey: dueRemindersKey });
    }
  });
}

export function useMarkReminderSentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markReminderSent,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: remindersKey });
      await queryClient.invalidateQueries({ queryKey: reminderKey(data.id) });
      await queryClient.invalidateQueries({ queryKey: dueRemindersKey });
    }
  });
}

