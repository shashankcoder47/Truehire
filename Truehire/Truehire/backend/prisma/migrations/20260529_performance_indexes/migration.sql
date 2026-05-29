CREATE INDEX IF NOT EXISTS "idx_app_messages_application_created"
  ON "application_messages"("application_id", "created_at", "id");

CREATE INDEX IF NOT EXISTS "idx_app_messages_conversation_created"
  ON "application_messages"("conversation_id", "created_at", "id");

CREATE INDEX IF NOT EXISTS "idx_app_messages_receiver_unread"
  ON "application_messages"("receiver_id", "receiver_role", "read_status");

CREATE INDEX IF NOT EXISTS "idx_job_applications_job_applied"
  ON "job_applications"("job_id", "applied_at");

CREATE INDEX IF NOT EXISTS "idx_job_applications_user_applied"
  ON "job_applications"("user_id", "applied_at");

CREATE INDEX IF NOT EXISTS "idx_jobs_recruiter_created"
  ON "jobs"("recruiter_id", "created_at");

CREATE INDEX IF NOT EXISTS "idx_jobs_status_created"
  ON "jobs"("status", "created_at");

CREATE INDEX IF NOT EXISTS "idx_notifications_status_created"
  ON "notifications"("status", "created_at");

CREATE INDEX IF NOT EXISTS "idx_user_notifications_user_created"
  ON "user_notifications"("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "idx_user_notifications_user_status_created"
  ON "user_notifications"("user_id", "status", "created_at");

CREATE INDEX IF NOT EXISTS "idx_udm_pair_created"
  ON "user_direct_messages"("sender_id", "receiver_id", "created_at");

CREATE INDEX IF NOT EXISTS "idx_direct_message_conversation_created"
  ON "user_direct_conversation_messages"("conversation_id", "created_at", "id");
