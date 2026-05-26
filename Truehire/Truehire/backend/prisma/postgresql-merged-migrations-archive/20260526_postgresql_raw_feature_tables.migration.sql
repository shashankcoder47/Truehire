-- PostgreSQL feature tables that were previously kept in MySQL-only SQL migrations.

CREATE TABLE IF NOT EXISTS "company_followers" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "company_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_followers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "company_followers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "company_followers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "company_network" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_network_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "company_network_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "company_network_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "company_posts" (
    "id" BIGSERIAL NOT NULL,
    "recruiter_id" BIGINT NOT NULL,
    "company_id" BIGINT NOT NULL,
    "caption" TEXT,
    "media_url" VARCHAR(1000),
    "media_type" VARCHAR(30),
    "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_posts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "company_posts_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "company_posts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "company_post_media" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "media_url" VARCHAR(1000) NOT NULL,
    "media_type" VARCHAR(30) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_post_media_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "company_post_media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "company_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "post_likes" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "company_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "post_comments" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "author_role" VARCHAR(30) NOT NULL DEFAULT 'USER',
    "parent_comment_id" BIGINT,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "company_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "post_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "post_comment_likes" (
    "id" BIGSERIAL NOT NULL,
    "comment_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "author_role" VARCHAR(30) NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_comment_likes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "post_comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "company_post_views" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_post_views_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "company_post_views_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "company_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "company_post_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "pulse_updates" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" VARCHAR(80) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pulse_updates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pulse_updates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "company_statuses" (
    "id" BIGSERIAL NOT NULL,
    "recruiter_id" BIGINT NOT NULL,
    "company_id" BIGINT NOT NULL,
    "media_url" VARCHAR(1000) NOT NULL,
    "media_type" VARCHAR(30) NOT NULL,
    "caption" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(0) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_statuses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "company_statuses_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "company_statuses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "company_status_views" (
    "id" BIGSERIAL NOT NULL,
    "status_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "viewed_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_status_views_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "company_status_views_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "company_statuses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "company_status_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "weekly_job_alert_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "week_start_date" DATE NOT NULL,
    "job_count" INTEGER NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_job_alert_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "weekly_job_alert_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "user_company_message_access" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "recruiter_id" BIGINT NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_company_message_access_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_company_message_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_company_message_access_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "user_company_message_payments" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "recruiter_id" BIGINT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "payment_method" VARCHAR(50),
    "transaction_id" VARCHAR(255),
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "razorpay_order_id" VARCHAR(255),
    "razorpay_payment_id" VARCHAR(255),
    "paid_at" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_company_message_payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_company_message_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_company_message_payments_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "user_posts" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "caption" TEXT,
    "media_url" VARCHAR(1000),
    "media_type" VARCHAR(30),
    "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_posts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "user_post_media" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "media_url" VARCHAR(1000) NOT NULL,
    "media_type" VARCHAR(30) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_post_media_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_post_media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "user_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "user_post_likes" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_post_likes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "user_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "user_post_comments" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "parent_comment_id" BIGINT,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_post_comments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "user_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_post_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "user_post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "user_post_comment_likes" (
    "id" BIGSERIAL NOT NULL,
    "comment_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_post_comment_likes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_post_comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "user_post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_post_comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "user_post_shares" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_post_shares_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_post_shares_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "user_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_post_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "user_direct_conversations" (
    "id" BIGSERIAL NOT NULL,
    "user1_id" BIGINT NOT NULL,
    "user1_type" VARCHAR(30) NOT NULL DEFAULT 'USER',
    "user2_id" BIGINT NOT NULL,
    "user2_type" VARCHAR(30) NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_direct_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_direct_conversation_messages" (
    "id" BIGSERIAL NOT NULL,
    "conversation_id" BIGINT NOT NULL,
    "sender_id" BIGINT NOT NULL,
    "sender_type" VARCHAR(30) NOT NULL DEFAULT 'USER',
    "receiver_id" BIGINT NOT NULL,
    "receiver_type" VARCHAR(30) NOT NULL DEFAULT 'USER',
    "message" TEXT NOT NULL,
    "reply_to_message_id" BIGINT,
    "is_read" SMALLINT NOT NULL DEFAULT 0,
    "edited_at" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_direct_conversation_messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_direct_conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "user_direct_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_direct_conversation_messages_reply_to_message_id_fkey" FOREIGN KEY ("reply_to_message_id") REFERENCES "user_direct_conversation_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "job_recommendation_emails" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "job_id" BIGINT NOT NULL,
    "sent_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_recommendation_emails_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "job_recommendation_emails_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "job_recommendation_emails_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "work_experience" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "company_name" VARCHAR(200),
    "job_title" VARCHAR(200),
    "employment_type" VARCHAR(100),
    "start_date" DATE,
    "end_date" DATE,
    "is_current" SMALLINT DEFAULT 0,
    "location" VARCHAR(200),
    "job_description" TEXT,
    "achievements" TEXT,
    "technologies_used" TEXT,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_experience_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "work_experience_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "education" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "qualification" VARCHAR(200),
    "degree" VARCHAR(200),
    "field_of_study" VARCHAR(200),
    "college_name" VARCHAR(200),
    "year_of_passing" INTEGER,
    "percentage" DECIMAL(5,2),
    "cgpa" DECIMAL(4,2),
    "certificate_file" VARCHAR(500),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "education_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "support_tickets" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "recruiter_id" BIGINT,
    "type" VARCHAR(100),
    "subject" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(50) DEFAULT 'open',
    "priority" VARCHAR(50) DEFAULT 'medium',
    "assigned_to" BIGINT,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "support_tickets_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "job_views" (
    "id" BIGSERIAL NOT NULL,
    "job_id" BIGINT NOT NULL,
    "user_id" BIGINT,
    "viewer_ip" VARCHAR(100),
    "viewer_fingerprint" VARCHAR(255),
    "device_fingerprint" VARCHAR(255),
    "viewed_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_views_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "job_views_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "job_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_company_followers_user_company" ON "company_followers"("user_id", "company_id");
CREATE INDEX IF NOT EXISTS "idx_company_followers_user_id" ON "company_followers"("user_id");
CREATE INDEX IF NOT EXISTS "idx_company_followers_company_id" ON "company_followers"("company_id");
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_company_network_user_company" ON "company_network"("user_id", "company_id");
CREATE INDEX IF NOT EXISTS "idx_company_network_company_id" ON "company_network"("company_id");
CREATE INDEX IF NOT EXISTS "idx_company_network_user_id" ON "company_network"("user_id");
CREATE INDEX IF NOT EXISTS "idx_company_posts_company_created" ON "company_posts"("company_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_company_posts_recruiter_id" ON "company_posts"("recruiter_id");
CREATE INDEX IF NOT EXISTS "idx_company_posts_status_created" ON "company_posts"("status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_company_post_media_post_order" ON "company_post_media"("post_id", "sort_order");
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_post_likes_user_post" ON "post_likes"("post_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_post_likes_post_id" ON "post_likes"("post_id");
CREATE INDEX IF NOT EXISTS "idx_post_likes_user_id" ON "post_likes"("user_id");
CREATE INDEX IF NOT EXISTS "idx_post_comments_post_id_created" ON "post_comments"("post_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_post_comments_user_id" ON "post_comments"("user_id");
CREATE INDEX IF NOT EXISTS "idx_post_comments_parent_created" ON "post_comments"("parent_comment_id", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_post_comment_likes_user_comment" ON "post_comment_likes"("comment_id", "user_id", "author_role");
CREATE INDEX IF NOT EXISTS "idx_post_comment_likes_comment_id" ON "post_comment_likes"("comment_id");
CREATE INDEX IF NOT EXISTS "idx_post_comment_likes_user_id" ON "post_comment_likes"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_company_post_views_user_post" ON "company_post_views"("post_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_company_post_views_post_id" ON "company_post_views"("post_id");
CREATE INDEX IF NOT EXISTS "idx_company_post_views_user_id" ON "company_post_views"("user_id");
CREATE INDEX IF NOT EXISTS "idx_pulse_updates_user_read_created" ON "pulse_updates"("user_id", "is_read", "created_at");
CREATE INDEX IF NOT EXISTS "idx_company_statuses_company_created" ON "company_statuses"("company_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_company_statuses_recruiter_id" ON "company_statuses"("recruiter_id");
CREATE INDEX IF NOT EXISTS "idx_company_statuses_active_expiry" ON "company_statuses"("status", "expires_at", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_company_status_view_user" ON "company_status_views"("status_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_company_status_views_status_id" ON "company_status_views"("status_id");
CREATE INDEX IF NOT EXISTS "idx_company_status_views_user_id" ON "company_status_views"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_weekly_job_alert_user_week" ON "weekly_job_alert_logs"("user_id", "week_start_date");
CREATE INDEX IF NOT EXISTS "idx_weekly_job_alert_sent_at" ON "weekly_job_alert_logs"("sent_at");
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_user_company_message_access" ON "user_company_message_access"("user_id", "recruiter_id");
CREATE INDEX IF NOT EXISTS "idx_ucma_user_status" ON "user_company_message_access"("user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_ucma_recruiter_status" ON "user_company_message_access"("recruiter_id", "status");
CREATE INDEX IF NOT EXISTS "idx_ucmp_user_recruiter" ON "user_company_message_payments"("user_id", "recruiter_id");
CREATE INDEX IF NOT EXISTS "idx_ucmp_razorpay_order" ON "user_company_message_payments"("razorpay_order_id");
CREATE INDEX IF NOT EXISTS "idx_user_posts_user_created" ON "user_posts"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_user_posts_status_created" ON "user_posts"("status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_user_post_media_post_order" ON "user_post_media"("post_id", "sort_order");
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_user_post_likes_user_post" ON "user_post_likes"("post_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_user_post_likes_post_id" ON "user_post_likes"("post_id");
CREATE INDEX IF NOT EXISTS "idx_user_post_likes_user_id" ON "user_post_likes"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_post_comments_post_created" ON "user_post_comments"("post_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_user_post_comments_parent_created" ON "user_post_comments"("parent_comment_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_user_post_comments_user_id" ON "user_post_comments"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_user_post_comment_likes_user_comment" ON "user_post_comment_likes"("comment_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_user_post_comment_likes_comment_id" ON "user_post_comment_likes"("comment_id");
CREATE INDEX IF NOT EXISTS "idx_user_post_comment_likes_user_id" ON "user_post_comment_likes"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_post_shares_post_id" ON "user_post_shares"("post_id");
CREATE INDEX IF NOT EXISTS "idx_user_post_shares_user_id" ON "user_post_shares"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_direct_conversation_typed_pair" ON "user_direct_conversations"("user1_id", "user1_type", "user2_id", "user2_type");
CREATE INDEX IF NOT EXISTS "idx_direct_conversation_user1" ON "user_direct_conversations"("user1_id");
CREATE INDEX IF NOT EXISTS "idx_direct_conversation_user2" ON "user_direct_conversations"("user2_id");
CREATE INDEX IF NOT EXISTS "idx_direct_message_reply_to" ON "user_direct_conversation_messages"("reply_to_message_id");
CREATE INDEX IF NOT EXISTS "idx_direct_message_conversation" ON "user_direct_conversation_messages"("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_direct_message_receiver_read" ON "user_direct_conversation_messages"("receiver_id", "is_read");
CREATE INDEX IF NOT EXISTS "idx_direct_message_created" ON "user_direct_conversation_messages"("created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_job_recommendation_email" ON "job_recommendation_emails"("user_id", "job_id");
CREATE INDEX IF NOT EXISTS "idx_work_experience_user_id" ON "work_experience"("user_id");
CREATE INDEX IF NOT EXISTS "idx_education_user_id" ON "education"("user_id");
CREATE INDEX IF NOT EXISTS "idx_support_tickets_user_id" ON "support_tickets"("user_id");
CREATE INDEX IF NOT EXISTS "idx_support_tickets_recruiter_id" ON "support_tickets"("recruiter_id");
CREATE INDEX IF NOT EXISTS "idx_job_views_job_id" ON "job_views"("job_id");
CREATE INDEX IF NOT EXISTS "idx_job_views_user_id" ON "job_views"("user_id");
