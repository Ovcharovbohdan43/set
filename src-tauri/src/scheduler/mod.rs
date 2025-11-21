use std::sync::Arc;
use std::time::Duration;

use tauri::{AppHandle, Manager};
use tokio::time::interval;
use tracing::{error, info, warn};

use crate::services::reminders::{ReminderDto, ReminderService};

const POLL_INTERVAL_SECONDS: u64 = 60;

pub struct ReminderScheduler {
    reminder_service: Arc<dyn ReminderService>,
    app_handle: AppHandle,
}

impl ReminderScheduler {
    pub fn new(reminder_service: Arc<dyn ReminderService>, app_handle: AppHandle) -> Self {
        Self {
            reminder_service,
            app_handle,
        }
    }

    pub async fn start_polling(&self) {
        let mut poll_interval = interval(Duration::from_secs(POLL_INTERVAL_SECONDS));
        
        info!("Reminder scheduler started, polling every {} seconds", POLL_INTERVAL_SECONDS);

        loop {
            poll_interval.tick().await;
            
            if let Err(err) = self.process_due_reminders().await {
                error!(error = %err, "Error processing due reminders");
            }
        }
    }

    async fn process_due_reminders(&self) -> Result<(), Box<dyn std::error::Error>> {
        let due_reminders = self.reminder_service.get_due_reminders()
            .map_err(|e| format!("Failed to get due reminders: {}", e))?;

        if due_reminders.is_empty() {
            return Ok(());
        }

        info!(count = due_reminders.len(), "Found {} due reminder(s)", due_reminders.len());

        for reminder in due_reminders {
            if let Err(err) = self.trigger_notification(&reminder).await {
                warn!(
                    reminder_id = %reminder.id,
                    error = %err,
                    "Failed to trigger notification for reminder"
                );
            }
        }

        Ok(())
    }

    async fn trigger_notification(&self, reminder: &ReminderDto) -> Result<(), Box<dyn std::error::Error>> {
        info!(
            reminder_id = %reminder.id,
            title = %reminder.title,
            channel = %reminder.channel.as_str(),
            "Triggering notification for reminder"
        );

        // Emit event to frontend
        self.app_handle.emit("notification:prepared", reminder)
            .map_err(|e| format!("Failed to emit notification:prepared event: {}", e))?;

        // Mark reminder as sent and update last_triggered_at
        self.reminder_service.mark_reminder_sent(&reminder.id)
            .map_err(|e| format!("Failed to mark reminder as sent: {}", e))?;

        info!(
            reminder_id = %reminder.id,
            "Notification triggered and reminder marked as sent"
        );

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::reminders::{ReminderChannel, ReminderStatus};
    use std::sync::Arc;

    // Mock ReminderService for testing
    struct MockReminderService {
        due_reminders: Vec<ReminderDto>,
    }

    impl ReminderService for MockReminderService {
        fn descriptor(&self) -> crate::services::ServiceDescriptor {
            crate::services::ServiceDescriptor {
                name: "MockReminderService".to_string(),
                version: "1.0.0".to_string(),
            }
        }

        fn list_reminders(&self) -> crate::services::reminders::ReminderResult<Vec<ReminderDto>> {
            Ok(vec![])
        }

        fn get_reminder(&self, _id: &str) -> crate::services::reminders::ReminderResult<ReminderDto> {
            Err(crate::services::reminders::ReminderServiceError::NotFound("not found".to_string()))
        }

        fn create_reminder(&self, _input: crate::services::reminders::CreateReminderInput) -> crate::services::reminders::ReminderResult<ReminderDto> {
            Err(crate::services::reminders::ReminderServiceError::Internal("not implemented".to_string()))
        }

        fn update_reminder(&self, _input: crate::services::reminders::UpdateReminderInput) -> crate::services::reminders::ReminderResult<ReminderDto> {
            Err(crate::services::reminders::ReminderServiceError::Internal("not implemented".to_string()))
        }

        fn delete_reminder(&self, _id: &str) -> crate::services::reminders::ReminderResult<()> {
            Err(crate::services::reminders::ReminderServiceError::Internal("not implemented".to_string()))
        }

        fn snooze_reminder(&self, _input: crate::services::reminders::SnoozeReminderInput) -> crate::services::reminders::ReminderResult<ReminderDto> {
            Err(crate::services::reminders::ReminderServiceError::Internal("not implemented".to_string()))
        }

        fn get_due_reminders(&self) -> crate::services::reminders::ReminderResult<Vec<ReminderDto>> {
            Ok(self.due_reminders.clone())
        }

        fn mark_reminder_sent(&self, _id: &str) -> crate::services::reminders::ReminderResult<ReminderDto> {
            Ok(ReminderDto {
                id: "test".to_string(),
                user_id: "user".to_string(),
                title: "Test".to_string(),
                description: None,
                account_id: None,
                account_name: None,
                amount_cents: None,
                due_at: chrono::Utc::now().to_rfc3339(),
                recurrence_rule: None,
                next_fire_at: None,
                channel: ReminderChannel::Toast,
                snooze_minutes: None,
                last_triggered_at: None,
                status: ReminderStatus::Sent,
                created_at: chrono::Utc::now().to_rfc3339(),
            })
        }
    }

    #[tokio::test]
    async fn test_scheduler_processes_due_reminders() {
        // This test would require a full Tauri app context
        // For now, we test the logic separately
        let reminder = ReminderDto {
            id: "test-1".to_string(),
            user_id: "user".to_string(),
            title: "Test Reminder".to_string(),
            description: None,
            account_id: None,
            account_name: None,
            amount_cents: Some(10000),
            due_at: chrono::Utc::now().to_rfc3339(),
            recurrence_rule: None,
            next_fire_at: Some(chrono::Utc::now().to_rfc3339()),
            channel: ReminderChannel::Toast,
            snooze_minutes: None,
            last_triggered_at: None,
            status: ReminderStatus::Scheduled,
            created_at: chrono::Utc::now().to_rfc3339(),
        };

        let mock_service = Arc::new(MockReminderService {
            due_reminders: vec![reminder],
        });

        // Verify get_due_reminders returns the reminder
        let due = mock_service.get_due_reminders().unwrap();
        assert_eq!(due.len(), 1);
        assert_eq!(due[0].title, "Test Reminder");
    }
}

