-- PostgreSQL repair for tables previously created by MySQL-only SQL.
-- The migrated tables existed without sequences, defaults, or conflict indexes.

CREATE SEQUENCE IF NOT EXISTS users_id_seq;
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1), EXISTS (SELECT 1 FROM users));
ALTER TABLE users ALTER COLUMN id SET DEFAULT nextval('users_id_seq');

CREATE SEQUENCE IF NOT EXISTS recruiters_id_seq;
SELECT setval('recruiters_id_seq', COALESCE((SELECT MAX(id) FROM recruiters), 1), EXISTS (SELECT 1 FROM recruiters));
ALTER TABLE recruiters ALTER COLUMN id SET DEFAULT nextval('recruiters_id_seq');

CREATE SEQUENCE IF NOT EXISTS admins_id_seq;
SELECT setval('admins_id_seq', COALESCE((SELECT MAX(id) FROM admins), 1), EXISTS (SELECT 1 FROM admins));
ALTER TABLE admins ALTER COLUMN id SET DEFAULT nextval('admins_id_seq');

CREATE SEQUENCE IF NOT EXISTS super_admins_id_seq;
SELECT setval('super_admins_id_seq', COALESCE((SELECT MAX(id) FROM super_admins), 1), EXISTS (SELECT 1 FROM super_admins));
ALTER TABLE super_admins ALTER COLUMN id SET DEFAULT nextval('super_admins_id_seq');

CREATE SEQUENCE IF NOT EXISTS sub_recruiters_id_seq;
SELECT setval('sub_recruiters_id_seq', COALESCE((SELECT MAX(id) FROM sub_recruiters), 1), EXISTS (SELECT 1 FROM sub_recruiters));
ALTER TABLE sub_recruiters ALTER COLUMN id SET DEFAULT nextval('sub_recruiters_id_seq');

CREATE SEQUENCE IF NOT EXISTS company_followers_id_seq;
SELECT setval('company_followers_id_seq', COALESCE((SELECT MAX(id) FROM company_followers), 1), EXISTS (SELECT 1 FROM company_followers));
ALTER TABLE company_followers ALTER COLUMN id SET DEFAULT nextval('company_followers_id_seq');

CREATE SEQUENCE IF NOT EXISTS company_network_id_seq;
SELECT setval('company_network_id_seq', COALESCE((SELECT MAX(id) FROM company_network), 1), EXISTS (SELECT 1 FROM company_network));
ALTER TABLE company_network ALTER COLUMN id SET DEFAULT nextval('company_network_id_seq');

CREATE SEQUENCE IF NOT EXISTS company_posts_id_seq;
SELECT setval('company_posts_id_seq', COALESCE((SELECT MAX(id) FROM company_posts), 1), EXISTS (SELECT 1 FROM company_posts));
ALTER TABLE company_posts ALTER COLUMN id SET DEFAULT nextval('company_posts_id_seq');

CREATE SEQUENCE IF NOT EXISTS company_post_media_id_seq;
SELECT setval('company_post_media_id_seq', COALESCE((SELECT MAX(id) FROM company_post_media), 1), EXISTS (SELECT 1 FROM company_post_media));
ALTER TABLE company_post_media ALTER COLUMN id SET DEFAULT nextval('company_post_media_id_seq');

CREATE SEQUENCE IF NOT EXISTS company_post_views_id_seq;
SELECT setval('company_post_views_id_seq', COALESCE((SELECT MAX(id) FROM company_post_views), 1), EXISTS (SELECT 1 FROM company_post_views));
ALTER TABLE company_post_views ALTER COLUMN id SET DEFAULT nextval('company_post_views_id_seq');

CREATE SEQUENCE IF NOT EXISTS post_likes_id_seq;
SELECT setval('post_likes_id_seq', COALESCE((SELECT MAX(id) FROM post_likes), 1), EXISTS (SELECT 1 FROM post_likes));
ALTER TABLE post_likes ALTER COLUMN id SET DEFAULT nextval('post_likes_id_seq');

CREATE SEQUENCE IF NOT EXISTS post_comments_id_seq;
SELECT setval('post_comments_id_seq', COALESCE((SELECT MAX(id) FROM post_comments), 1), EXISTS (SELECT 1 FROM post_comments));
ALTER TABLE post_comments ALTER COLUMN id SET DEFAULT nextval('post_comments_id_seq');

CREATE SEQUENCE IF NOT EXISTS post_comment_likes_id_seq;
SELECT setval('post_comment_likes_id_seq', COALESCE((SELECT MAX(id) FROM post_comment_likes), 1), EXISTS (SELECT 1 FROM post_comment_likes));
ALTER TABLE post_comment_likes ALTER COLUMN id SET DEFAULT nextval('post_comment_likes_id_seq');

CREATE SEQUENCE IF NOT EXISTS pulse_updates_id_seq;
SELECT setval('pulse_updates_id_seq', COALESCE((SELECT MAX(id) FROM pulse_updates), 1), EXISTS (SELECT 1 FROM pulse_updates));
ALTER TABLE pulse_updates ALTER COLUMN id SET DEFAULT nextval('pulse_updates_id_seq');

CREATE SEQUENCE IF NOT EXISTS company_statuses_id_seq;
SELECT setval('company_statuses_id_seq', COALESCE((SELECT MAX(id) FROM company_statuses), 1), EXISTS (SELECT 1 FROM company_statuses));
ALTER TABLE company_statuses ALTER COLUMN id SET DEFAULT nextval('company_statuses_id_seq');

CREATE SEQUENCE IF NOT EXISTS company_status_views_id_seq;
SELECT setval('company_status_views_id_seq', COALESCE((SELECT MAX(id) FROM company_status_views), 1), EXISTS (SELECT 1 FROM company_status_views));
ALTER TABLE company_status_views ALTER COLUMN id SET DEFAULT nextval('company_status_views_id_seq');

CREATE SEQUENCE IF NOT EXISTS user_posts_id_seq;
SELECT setval('user_posts_id_seq', COALESCE((SELECT MAX(id) FROM user_posts), 1), EXISTS (SELECT 1 FROM user_posts));
ALTER TABLE user_posts ALTER COLUMN id SET DEFAULT nextval('user_posts_id_seq');

CREATE SEQUENCE IF NOT EXISTS user_post_media_id_seq;
SELECT setval('user_post_media_id_seq', COALESCE((SELECT MAX(id) FROM user_post_media), 1), EXISTS (SELECT 1 FROM user_post_media));
ALTER TABLE user_post_media ALTER COLUMN id SET DEFAULT nextval('user_post_media_id_seq');

CREATE SEQUENCE IF NOT EXISTS user_post_likes_id_seq;
SELECT setval('user_post_likes_id_seq', COALESCE((SELECT MAX(id) FROM user_post_likes), 1), EXISTS (SELECT 1 FROM user_post_likes));
ALTER TABLE user_post_likes ALTER COLUMN id SET DEFAULT nextval('user_post_likes_id_seq');

CREATE SEQUENCE IF NOT EXISTS user_post_comments_id_seq;
SELECT setval('user_post_comments_id_seq', COALESCE((SELECT MAX(id) FROM user_post_comments), 1), EXISTS (SELECT 1 FROM user_post_comments));
ALTER TABLE user_post_comments ALTER COLUMN id SET DEFAULT nextval('user_post_comments_id_seq');

CREATE SEQUENCE IF NOT EXISTS user_post_comment_likes_id_seq;
SELECT setval('user_post_comment_likes_id_seq', COALESCE((SELECT MAX(id) FROM user_post_comment_likes), 1), EXISTS (SELECT 1 FROM user_post_comment_likes));
ALTER TABLE user_post_comment_likes ALTER COLUMN id SET DEFAULT nextval('user_post_comment_likes_id_seq');

CREATE SEQUENCE IF NOT EXISTS user_post_shares_id_seq;
SELECT setval('user_post_shares_id_seq', COALESCE((SELECT MAX(id) FROM user_post_shares), 1), EXISTS (SELECT 1 FROM user_post_shares));
ALTER TABLE user_post_shares ALTER COLUMN id SET DEFAULT nextval('user_post_shares_id_seq');

CREATE SEQUENCE IF NOT EXISTS user_direct_conversations_id_seq;
SELECT setval('user_direct_conversations_id_seq', COALESCE((SELECT MAX(id) FROM user_direct_conversations), 1), EXISTS (SELECT 1 FROM user_direct_conversations));
ALTER TABLE user_direct_conversations ALTER COLUMN id SET DEFAULT nextval('user_direct_conversations_id_seq');

CREATE SEQUENCE IF NOT EXISTS user_direct_conversation_messages_id_seq;
SELECT setval('user_direct_conversation_messages_id_seq', COALESCE((SELECT MAX(id) FROM user_direct_conversation_messages), 1), EXISTS (SELECT 1 FROM user_direct_conversation_messages));
ALTER TABLE user_direct_conversation_messages ALTER COLUMN id SET DEFAULT nextval('user_direct_conversation_messages_id_seq');

CREATE SEQUENCE IF NOT EXISTS user_notifications_id_seq;
SELECT setval('user_notifications_id_seq', COALESCE((SELECT MAX(id) FROM user_notifications), 1), EXISTS (SELECT 1 FROM user_notifications));
ALTER TABLE user_notifications ALTER COLUMN id SET DEFAULT nextval('user_notifications_id_seq');

CREATE SEQUENCE IF NOT EXISTS user_follows_id_seq;
SELECT setval('user_follows_id_seq', COALESCE((SELECT MAX(id) FROM user_follows), 1), EXISTS (SELECT 1 FROM user_follows));
ALTER TABLE user_follows ALTER COLUMN id SET DEFAULT nextval('user_follows_id_seq');

CREATE SEQUENCE IF NOT EXISTS job_recommendation_emails_id_seq;
SELECT setval('job_recommendation_emails_id_seq', COALESCE((SELECT MAX(id) FROM job_recommendation_emails), 1), EXISTS (SELECT 1 FROM job_recommendation_emails));
ALTER TABLE job_recommendation_emails ALTER COLUMN id SET DEFAULT nextval('job_recommendation_emails_id_seq');

CREATE SEQUENCE IF NOT EXISTS weekly_job_alert_logs_id_seq;
SELECT setval('weekly_job_alert_logs_id_seq', COALESCE((SELECT MAX(id) FROM weekly_job_alert_logs), 1), EXISTS (SELECT 1 FROM weekly_job_alert_logs));
ALTER TABLE weekly_job_alert_logs ALTER COLUMN id SET DEFAULT nextval('weekly_job_alert_logs_id_seq');

CREATE SEQUENCE IF NOT EXISTS user_company_message_access_id_seq;
SELECT setval('user_company_message_access_id_seq', COALESCE((SELECT MAX(id) FROM user_company_message_access), 1), EXISTS (SELECT 1 FROM user_company_message_access));
ALTER TABLE user_company_message_access ALTER COLUMN id SET DEFAULT nextval('user_company_message_access_id_seq');

CREATE SEQUENCE IF NOT EXISTS user_company_message_payments_id_seq;
SELECT setval('user_company_message_payments_id_seq', COALESCE((SELECT MAX(id) FROM user_company_message_payments), 1), EXISTS (SELECT 1 FROM user_company_message_payments));
ALTER TABLE user_company_message_payments ALTER COLUMN id SET DEFAULT nextval('user_company_message_payments_id_seq');

-- Restore AUTO_INCREMENT behavior on any remaining imported application table.
DO $$
DECLARE
  table_row record;
  sequence_name text;
BEGIN
  FOR table_row IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'id'
      AND data_type IN ('integer', 'bigint')
      AND column_default IS NULL
  LOOP
    sequence_name := table_row.table_name || '_id_seq';
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I', sequence_name);
    EXECUTE format(
      'SELECT setval(%L, COALESCE((SELECT MAX(id) FROM %I), 1), EXISTS (SELECT 1 FROM %I))',
      sequence_name,
      table_row.table_name,
      table_row.table_name
    );
    EXECUTE format(
      'ALTER TABLE %I ALTER COLUMN id SET DEFAULT nextval(%L)',
      table_row.table_name,
      sequence_name
    );
  END LOOP;
END $$;

ALTER TABLE company_followers ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE company_network ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE company_posts ALTER COLUMN status SET DEFAULT 'ACTIVE', ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE company_post_media ALTER COLUMN sort_order SET DEFAULT 0, ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE company_post_views ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE post_likes ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE post_comments ALTER COLUMN author_role SET DEFAULT 'USER', ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE post_comment_likes ALTER COLUMN author_role SET DEFAULT 'USER', ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE pulse_updates ALTER COLUMN is_read SET DEFAULT 0, ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE company_statuses ALTER COLUMN status SET DEFAULT 'ACTIVE', ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE company_status_views ALTER COLUMN viewed_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_posts ALTER COLUMN status SET DEFAULT 'ACTIVE', ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_post_media ALTER COLUMN sort_order SET DEFAULT 0, ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_post_likes ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_post_comments ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_post_comment_likes ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_post_shares ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_direct_conversations ALTER COLUMN user1_type SET DEFAULT 'USER', ALTER COLUMN user2_type SET DEFAULT 'USER', ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_direct_conversation_messages ALTER COLUMN sender_type SET DEFAULT 'USER', ALTER COLUMN receiver_type SET DEFAULT 'USER', ALTER COLUMN is_read SET DEFAULT 0, ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_notifications ALTER COLUMN status SET DEFAULT 'UNREAD', ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_follows ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE job_recommendation_emails ALTER COLUMN sent_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE weekly_job_alert_logs ALTER COLUMN job_count SET DEFAULT 0, ALTER COLUMN sent_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_company_message_access ALTER COLUMN status SET DEFAULT 'ACTIVE', ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_company_message_payments ALTER COLUMN currency SET DEFAULT 'INR', ALTER COLUMN status SET DEFAULT 'PENDING', ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'USER', ALTER COLUMN status SET DEFAULT 'ACTIVE', ALTER COLUMN login_type SET DEFAULT 'EMAIL', ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE recruiters ALTER COLUMN role SET DEFAULT 'RECRUITER', ALTER COLUMN status SET DEFAULT 'ACTIVE', ALTER COLUMN login_type SET DEFAULT 'EMAIL', ALTER COLUMN approval_status SET DEFAULT 'PENDING', ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE admins ALTER COLUMN role SET DEFAULT 'ADMIN', ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE super_admins ALTER COLUMN role SET DEFAULT 'SUPER_ADMIN', ALTER COLUMN status SET DEFAULT 'ACTIVE', ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE sub_recruiters ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_company_followers_user_company ON company_followers (user_id, company_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_company_network_user_company ON company_network (user_id, company_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_company_post_views_user_post ON company_post_views (post_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_post_likes_user_post ON post_likes (post_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_post_comment_likes_user_comment ON post_comment_likes (comment_id, user_id, author_role);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_company_status_view_user ON company_status_views (status_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_post_likes_user_post ON user_post_likes (post_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_post_comment_likes_user_comment ON user_post_comment_likes (comment_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_direct_conversation_typed_pair ON user_direct_conversations (user1_id, user1_type, user2_id, user2_type);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_follows_pair ON user_follows (follower_id, following_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_job_recommendation_email ON job_recommendation_emails (user_id, job_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_weekly_job_alert_user_week ON weekly_job_alert_logs (user_id, week_start_date);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_company_message_access ON user_company_message_access (user_id, recruiter_id);

-- Convert MySQL TINYINT boolean columns used through Prisma to PostgreSQL BOOLEAN.
DO $$
DECLARE
  column_row record;
BEGIN
  FOR column_row IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type = 'integer'
      AND (table_name, column_name) IN (
        ('application_messages', 'read_status'),
        ('application_messages', 'is_pinned'),
        ('applications', 'smart_suggestion_triggered'),
        ('banner_images', 'is_active'),
        ('companies', 'profile_complete'),
        ('favourite_notifications', 'is_read'),
        ('job_applications', 'smart_suggestion_triggered'),
        ('jobs', 'is_featured'),
        ('jobs', 'is_urgent'),
        ('projects', 'is_featured'),
        ('recruiter_notifications', 'is_read'),
        ('recruiters', 'profile_complete'),
        ('recruiters', 'company_profile_complete'),
        ('recruiters', 'phone_verified'),
        ('recruiters', 'is_premium'),
        ('resumes', 'is_featured'),
        ('resumes', 'flagged'),
        ('subscription_plans', 'is_active'),
        ('user_direct_messages', 'is_read'),
        ('users', 'profile_complete'),
        ('users', 'phone_verified'),
        ('users', 'one_click_apply_enabled'),
        ('users', 'email_notifications'),
        ('users', 'job_alerts'),
        ('users', 'relocated')
      )
  LOOP
    EXECUTE format(
      'ALTER TABLE %I ALTER COLUMN %I TYPE BOOLEAN USING CASE WHEN %I IS NULL THEN NULL ELSE %I <> 0 END',
      column_row.table_name,
      column_row.column_name,
      column_row.column_name,
      column_row.column_name
    );
  END LOOP;
END $$;

ALTER TABLE application_messages ALTER COLUMN read_status SET DEFAULT FALSE, ALTER COLUMN is_pinned SET DEFAULT FALSE;
ALTER TABLE applications ALTER COLUMN smart_suggestion_triggered SET DEFAULT FALSE;
ALTER TABLE banner_images ALTER COLUMN is_active SET DEFAULT TRUE;
ALTER TABLE companies ALTER COLUMN profile_complete SET DEFAULT FALSE;
ALTER TABLE favourite_notifications ALTER COLUMN is_read SET DEFAULT FALSE;
ALTER TABLE job_applications ALTER COLUMN smart_suggestion_triggered SET DEFAULT FALSE;
ALTER TABLE jobs ALTER COLUMN is_featured SET DEFAULT FALSE, ALTER COLUMN is_urgent SET DEFAULT FALSE;
ALTER TABLE projects ALTER COLUMN is_featured SET DEFAULT FALSE;
ALTER TABLE recruiter_notifications ALTER COLUMN is_read SET DEFAULT FALSE;
ALTER TABLE recruiters ALTER COLUMN profile_complete SET DEFAULT FALSE, ALTER COLUMN company_profile_complete SET DEFAULT FALSE, ALTER COLUMN phone_verified SET DEFAULT FALSE, ALTER COLUMN is_premium SET DEFAULT FALSE;
ALTER TABLE resumes ALTER COLUMN is_featured SET DEFAULT FALSE, ALTER COLUMN flagged SET DEFAULT FALSE;
ALTER TABLE subscription_plans ALTER COLUMN is_active SET DEFAULT TRUE;
ALTER TABLE user_direct_messages ALTER COLUMN is_read SET DEFAULT FALSE;
ALTER TABLE users ALTER COLUMN profile_complete SET DEFAULT FALSE, ALTER COLUMN phone_verified SET DEFAULT FALSE, ALTER COLUMN one_click_apply_enabled SET DEFAULT TRUE, ALTER COLUMN email_notifications SET DEFAULT TRUE, ALTER COLUMN job_alerts SET DEFAULT TRUE, ALTER COLUMN relocated SET DEFAULT FALSE;
