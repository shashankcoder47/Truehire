/*
  Warnings:

  - You are about to drop the `companyrating` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `job` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `jobapplication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `recruiter` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `resettoken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subrecruiter` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `upload` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `userreview` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `companyrating` DROP FOREIGN KEY `CompanyRating_recruiterId_fkey`;

-- DropForeignKey
ALTER TABLE `companyrating` DROP FOREIGN KEY `CompanyRating_userId_fkey`;

-- DropForeignKey
ALTER TABLE `job` DROP FOREIGN KEY `Job_recruiterId_fkey`;

-- DropForeignKey
ALTER TABLE `jobapplication` DROP FOREIGN KEY `JobApplication_jobId_fkey`;

-- DropForeignKey
ALTER TABLE `jobapplication` DROP FOREIGN KEY `JobApplication_userId_fkey`;

-- DropForeignKey
ALTER TABLE `recruiter` DROP FOREIGN KEY `Recruiter_userId_fkey`;

-- DropForeignKey
ALTER TABLE `resettoken` DROP FOREIGN KEY `ResetToken_userId_fkey`;

-- DropForeignKey
ALTER TABLE `subrecruiter` DROP FOREIGN KEY `SubRecruiter_recruiterId_fkey`;

-- DropForeignKey
ALTER TABLE `upload` DROP FOREIGN KEY `Upload_uploadedById_fkey`;

-- DropForeignKey
ALTER TABLE `userreview` DROP FOREIGN KEY `UserReview_userId_fkey`;

-- DropTable
DROP TABLE `companyrating`;

-- DropTable
DROP TABLE `job`;

-- DropTable
DROP TABLE `jobapplication`;

-- DropTable
DROP TABLE `recruiter`;

-- DropTable
DROP TABLE `resettoken`;

-- DropTable
DROP TABLE `subrecruiter`;

-- DropTable
DROP TABLE `upload`;

-- DropTable
DROP TABLE `user`;

-- DropTable
DROP TABLE `userreview`;

-- CreateTable
CREATE TABLE `admins` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_conversations` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `application_id` BIGINT NOT NULL,
    `job_id` BIGINT NOT NULL,
    `recruiter_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `last_message_id` BIGINT NULL,
    `last_message_at` DATETIME(0) NULL,
    `recruiter_notes` TEXT NULL,
    `user_unread_email_sent_at` DATETIME(0) NULL,
    `recruiter_unread_email_sent_at` DATETIME(0) NULL,
    `user_last_seen_message_id` BIGINT NULL,
    `user_seen_at` DATETIME(0) NULL,
    `recruiter_last_seen_message_id` BIGINT NULL,
    `recruiter_seen_at` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_appconv_application`(`application_id`),
    INDEX `idx_appconv_job`(`job_id`),
    INDEX `idx_appconv_recruiter`(`recruiter_id`),
    INDEX `idx_appconv_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_message_attachments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `message_id` BIGINT NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_type` VARCHAR(100) NULL,
    `file_size` BIGINT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_app_msg_attach_message`(`message_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_messages` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `conversation_id` BIGINT NOT NULL,
    `application_id` BIGINT NOT NULL,
    `job_id` BIGINT NOT NULL,
    `sender_id` BIGINT NOT NULL,
    `sender_role` ENUM('USER', 'RECRUITER', 'SUPER_ADMIN') NOT NULL,
    `receiver_id` BIGINT NOT NULL,
    `receiver_role` ENUM('USER', 'RECRUITER', 'SUPER_ADMIN') NOT NULL,
    `message` TEXT NOT NULL,
    `read_status` BOOLEAN NULL DEFAULT false,
    `read_at` DATETIME(0) NULL,
    `is_pinned` BOOLEAN NULL DEFAULT false,
    `pinned_at` DATETIME(0) NULL,
    `pinned_by_role` ENUM('USER', 'RECRUITER', 'SUPER_ADMIN') NULL,
    `pinned_by_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_app_messages_application`(`application_id`),
    INDEX `idx_app_messages_conversation`(`conversation_id`),
    INDEX `idx_app_messages_job`(`job_id`),
    INDEX `idx_app_messages_read`(`read_status`),
    INDEX `idx_app_messages_receiver`(`receiver_id`),
    INDEX `idx_app_messages_sender`(`sender_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `applications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `job_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `location` VARCHAR(150) NULL,
    `experience_level` VARCHAR(100) NULL,
    `current_salary` DECIMAL(12, 2) NULL,
    `expected_salary` DECIMAL(12, 2) NULL,
    `notice_period` INTEGER NULL,
    `additional_comments` TEXT NULL,
    `resume_path` VARCHAR(500) NULL,
    `applied_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `recruiter_last_action_at` DATETIME(0) NULL,
    `smart_suggestion_triggered` BOOLEAN NULL DEFAULT false,
    `smart_timer_started_at` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_app_email`(`email`),
    INDEX `idx_app_job`(`job_id`),
    INDEX `idx_app_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banner_images` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `image_path` VARCHAR(500) NOT NULL,
    `image_url` VARCHAR(500) NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `display_order` INTEGER NULL DEFAULT 0,
    `uploaded_by` BIGINT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_banner_uploaded_by`(`uploaded_by`),
    INDEX `idx_banner_active`(`is_active`),
    INDEX `idx_banner_display_order`(`display_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certifications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `certification_name` VARCHAR(200) NOT NULL,
    `issuing_organization` VARCHAR(200) NULL,
    `issue_date` DATE NULL,
    `expiry_date` DATE NULL,
    `credential_id` VARCHAR(150) NULL,
    `credential_url` VARCHAR(300) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_certifications_issue_date`(`issue_date`),
    INDEX `idx_certifications_name`(`certification_name`),
    INDEX `idx_certifications_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `companies` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `recruiter_id` BIGINT NOT NULL,
    `company_name` VARCHAR(200) NOT NULL,
    `company_type` VARCHAR(100) NULL,
    `industry` VARCHAR(150) NULL,
    `company_size` VARCHAR(100) NULL,
    `year_founded` YEAR NULL,
    `official_email` VARCHAR(150) NULL,
    `phone_number` VARCHAR(20) NULL,
    `website` VARCHAR(300) NULL,
    `headquarters_location` VARCHAR(200) NULL,
    `short_overview` TEXT NULL,
    `detailed_description` TEXT NULL,
    `company_logo` VARCHAR(500) NULL,
    `linkedin` VARCHAR(300) NULL,
    `instagram` VARCHAR(300) NULL,
    `facebook` VARCHAR(300) NULL,
    `profile_complete` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_companies_industry`(`industry`),
    INDEX `idx_companies_name`(`company_name`),
    INDEX `idx_companies_recruiter`(`recruiter_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_ratings` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `company_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `rating` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_company_ratings_company`(`company_id`),
    INDEX `idx_company_ratings_rating`(`rating`),
    INDEX `idx_company_ratings_user`(`user_id`),
    UNIQUE INDEX `unique_company_user`(`company_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favourite_companies` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `company_id` BIGINT NOT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_company`(`company_id`),
    INDEX `idx_user`(`user_id`),
    UNIQUE INDEX `uniq_user_company`(`user_id`, `company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favourite_notifications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `type` ENUM('FAV_COMPANY_NEW_JOB') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `entity_type` ENUM('JOB', 'COMPANY') NULL DEFAULT 'JOB',
    `entity_id` BIGINT NULL,
    `is_read` BOOLEAN NULL DEFAULT false,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_created`(`created_at`),
    INDEX `idx_read`(`user_id`, `is_read`),
    INDEX `idx_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `introduction_videos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `application_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `job_id` BIGINT NOT NULL,
    `recruiter_id` BIGINT NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_size` BIGINT NULL,
    `duration_seconds` INTEGER NULL,
    `uploaded_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_intro_videos_application`(`application_id`),
    INDEX `idx_intro_videos_job`(`job_id`),
    INDEX `idx_intro_videos_recruiter`(`recruiter_id`),
    INDEX `idx_intro_videos_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_applications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `job_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `status` ENUM('APPLIED', 'SHORTLISTED', 'INTERVIEW', 'REJECTED', 'HIRED', 'WITHDRAWN') NULL DEFAULT 'APPLIED',
    `applied_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `notes` TEXT NULL,
    `total_view_seconds` INTEGER NULL DEFAULT 0,
    `rejection_reason` TEXT NULL,
    `recruiter_last_action_at` DATETIME(0) NULL,
    `smart_timer_started_at` DATETIME(0) NULL,
    `smart_suggestion_triggered` BOOLEAN NULL DEFAULT false,
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_job_applications_job`(`job_id`),
    INDEX `idx_job_applications_status`(`status`),
    INDEX `idx_job_applications_user`(`user_id`),
    UNIQUE INDEX `unique_job_user`(`job_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jobs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `recruiter_id` BIGINT NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `company` VARCHAR(200) NULL,
    `location` VARCHAR(150) NULL,
    `employment_type` VARCHAR(50) NULL,
    `experience_level` ENUM('ENTRY_LEVEL', 'INTERNSHIP_LEVEL', 'MID_LEVEL', 'SENIOR_LEVEL', 'EXECUTIVE_LEVEL') NULL,
    `salary_min` DECIMAL(12, 2) NULL,
    `salary_max` DECIMAL(12, 2) NULL,
    `salary_currency` VARCHAR(10) NULL DEFAULT 'INR',
    `description` TEXT NULL,
    `requirements` TEXT NULL,
    `benefits` TEXT NULL,
    `skills_required` TEXT NULL,
    `application_deadline` DATE NULL,
    `status` ENUM('DRAFT', 'OPEN', 'CLOSED', 'PAUSED') NULL DEFAULT 'DRAFT',
    `is_featured` BOOLEAN NULL DEFAULT false,
    `is_urgent` BOOLEAN NULL DEFAULT false,
    `views_count` INTEGER NULL DEFAULT 0,
    `applications_count` INTEGER NULL DEFAULT 0,
    `deadline_notification_sent_at` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `closed_at` DATETIME(0) NULL,
    `company_logo` VARCHAR(500) NULL,
    `max_applicants` INTEGER NULL,

    INDEX `idx_jobs_location`(`location`),
    INDEX `idx_jobs_recruiter`(`recruiter_id`),
    INDEX `idx_jobs_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `migrations` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `run_on` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `name`(`name`),
    INDEX `idx_migrations_name`(`name`),
    INDEX `idx_migrations_run_on`(`run_on`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(100) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `message` TEXT NOT NULL,
    `recipient_type` ENUM('ALL', 'USER', 'RECRUITER', 'SUPER_ADMIN') NOT NULL,
    `recipient_ids` JSON NULL,
    `status` ENUM('DRAFT', 'SENT', 'SCHEDULED', 'FAILED') NULL DEFAULT 'DRAFT',
    `sent_at` DATETIME(0) NULL,
    `created_by` BIGINT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_notifications_recipient_type`(`recipient_type`),
    INDEX `idx_notifications_sent_at`(`sent_at`),
    INDEX `idx_notifications_status`(`status`),
    INDEX `idx_notifications_type`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otp_codes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(150) NOT NULL,
    `otp_code` VARCHAR(10) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `expires_at` DATETIME(0) NOT NULL,

    INDEX `idx_otp_email`(`email`),
    INDEX `idx_otp_expires`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `recruiter_id` BIGINT NOT NULL,
    `plan_id` BIGINT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(10) NULL DEFAULT 'INR',
    `payment_method` VARCHAR(100) NULL,
    `transaction_id` VARCHAR(255) NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NULL DEFAULT 'PENDING',
    `description` TEXT NULL,
    `invoice_url` VARCHAR(500) NULL,
    `paid_at` DATETIME(0) NULL,
    `razorpay_order_id` VARCHAR(255) NULL,
    `razorpay_payment_id` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `transaction_id`(`transaction_id`),
    INDEX `idx_payments_plan`(`plan_id`),
    INDEX `idx_payments_recruiter`(`recruiter_id`),
    INDEX `idx_payments_status`(`status`),
    INDEX `idx_payments_transaction`(`transaction_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `technologies_used` TEXT NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `role_responsibility` TEXT NULL,
    `achievements` TEXT NULL,
    `github_link` VARCHAR(300) NULL,
    `live_link` VARCHAR(300) NULL,
    `screenshots` JSON NULL,
    `is_featured` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_projects_dates`(`start_date`, `end_date`),
    INDEX `idx_projects_featured`(`is_featured`),
    INDEX `idx_projects_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recruiter_activity_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `recruiter_id` BIGINT NOT NULL,
    `action_type` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(100) NULL,
    `entity_id` BIGINT NULL,
    `duration_seconds` INTEGER NULL,
    `metadata` JSON NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_recruiter_activity_action`(`action_type`),
    INDEX `idx_recruiter_activity_created`(`created_at`),
    INDEX `idx_recruiter_activity_entity`(`entity_type`, `entity_id`),
    INDEX `idx_recruiter_activity_recruiter`(`recruiter_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recruiter_notifications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `recruiter_id` BIGINT NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `message` TEXT NOT NULL,
    `application_id` BIGINT NULL,
    `is_read` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_recruiter_notifications_application`(`application_id`),
    INDEX `idx_recruiter_notifications_read`(`is_read`),
    INDEX `idx_recruiter_notifications_recruiter`(`recruiter_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recruiter_subscriptions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `recruiter_id` BIGINT NOT NULL,
    `plan_id` BIGINT NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING') NULL DEFAULT 'PENDING',
    `payment_status` ENUM('PAID', 'UNPAID', 'FAILED', 'REFUNDED') NULL DEFAULT 'UNPAID',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_recruiter_subscription_plan`(`plan_id`),
    INDEX `idx_recruiter_subscription_recruiter`(`recruiter_id`),
    INDEX `idx_recruiter_subscription_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recruiter_verification_documents` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `recruiter_id` BIGINT NOT NULL,
    `doc_type` VARCHAR(100) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NULL DEFAULT 'PENDING',
    `rejection_reason` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `reviewed_at` DATETIME(0) NULL,
    `company_image` VARCHAR(255) NULL,

    INDEX `idx_recruiter_docs_recruiter`(`recruiter_id`),
    INDEX `idx_recruiter_docs_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recruiters` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `recruiter_id` VARCHAR(100) NULL,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password` VARCHAR(255) NULL,
    `company` VARCHAR(200) NULL,
    `role` ENUM('RECRUITER', 'SUB_RECRUITER', 'ADMIN') NULL DEFAULT 'RECRUITER',
    `status` ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') NULL DEFAULT 'ACTIVE',
    `profile_complete` BOOLEAN NULL DEFAULT false,
    `job_post_limit` INTEGER NULL DEFAULT 0,
    `subscription_status` ENUM('FREE', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'TRIAL', 'PAUSED') NULL,
    `subscription_expiry` DATE NULL,
    `sub_recruiters` INTEGER NULL DEFAULT 0,
    `company_name` VARCHAR(200) NULL,
    `company_type` VARCHAR(100) NULL,
    `category` VARCHAR(150) NULL,
    `industry` VARCHAR(150) NULL,
    `company_size` VARCHAR(100) NULL,
    `year_founded` YEAR NULL,
    `official_email` VARCHAR(150) NULL,
    `phone_number` VARCHAR(20) NULL,
    `website` VARCHAR(300) NULL,
    `headquarters_location` VARCHAR(200) NULL,
    `short_overview` TEXT NULL,
    `detailed_description` TEXT NULL,
    `company_logo` VARCHAR(500) NULL,
    `linkedin` VARCHAR(300) NULL,
    `instagram` VARCHAR(300) NULL,
    `facebook` VARCHAR(300) NULL,
    `company_profile_complete` BOOLEAN NULL DEFAULT false,
    `company_created_at` DATETIME(0) NULL,
    `company_updated_at` DATETIME(0) NULL,
    `google_id` VARCHAR(255) NULL,
    `login_type` ENUM('EMAIL', 'GOOGLE') NULL DEFAULT 'EMAIL',
    `approval_status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `approval_rejection_reason` TEXT NULL,
    `approval_reviewed_at` DATETIME(0) NULL,
    `approval_reviewed_by` BIGINT NULL,
    `onboarding_step` INTEGER NULL DEFAULT 0,
    `onboarding_completed_at` DATETIME(0) NULL,
    `phone_verified` BOOLEAN NULL DEFAULT false,
    `phone_verified_at` DATETIME(0) NULL,
    `is_premium` BOOLEAN NULL DEFAULT false,
    `premium_expiry` DATE NULL,
    `premium_expiry_at` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `recruiter_id`(`recruiter_id`),
    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reset_tokens` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(255) NOT NULL,
    `user_id` BIGINT NOT NULL,
    `user_type` ENUM('USER', 'RECRUITER', 'SUPER_ADMIN') NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `token`(`token`),
    INDEX `idx_reset_email`(`email`),
    INDEX `idx_reset_expires`(`expires_at`),
    INDEX `idx_reset_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resumes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_size` BIGINT NULL,
    `file_type` VARCHAR(50) NULL,
    `visibility` ENUM('PUBLIC', 'PRIVATE', 'RECRUITERS_ONLY') NULL DEFAULT 'PRIVATE',
    `download_count` INTEGER NULL DEFAULT 0,
    `is_featured` BOOLEAN NULL DEFAULT false,
    `flagged` BOOLEAN NULL DEFAULT false,
    `flag_reason` TEXT NULL,
    `uploaded_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_resumes_flagged`(`flagged`),
    INDEX `idx_resumes_user`(`user_id`),
    INDEX `idx_resumes_visibility`(`visibility`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saved_jobs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `job_id` BIGINT NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_saved_jobs_job`(`job_id`),
    INDEX `idx_saved_jobs_user`(`user_id`),
    UNIQUE INDEX `unique_user_job`(`user_id`, `job_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sub_recruiters` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `recruiter_id` BIGINT NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `email`(`email`),
    INDEX `idx_sub_recruiter_parent`(`recruiter_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription_plans` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `duration_months` INTEGER NOT NULL,
    `job_post_limit` INTEGER NULL DEFAULT 0,
    `features` JSON NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_subscription_active`(`is_active`),
    INDEX `idx_subscription_price`(`price`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `super_admins` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') NULL DEFAULT 'ACTIVE',
    `last_login` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_connections` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `sender_id` BIGINT NOT NULL,
    `receiver_id` BIGINT NOT NULL,
    `status` ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
    `pair_key` VARCHAR(64) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uniq_user_connections_pair`(`pair_key`),
    INDEX `idx_user_connections_receiver_status`(`receiver_id`, `status`),
    INDEX `idx_user_connections_sender_status`(`sender_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_notifications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `application_id` BIGINT NULL,
    `message` TEXT NOT NULL,
    `metadata` JSON NULL,
    `status` ENUM('UNREAD', 'READ') NULL DEFAULT 'UNREAD',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_user_notifications_application`(`application_id`),
    INDEX `idx_user_notifications_status`(`status`),
    INDEX `idx_user_notifications_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `rating` TINYINT NOT NULL,
    `review_message` TEXT NOT NULL,
    `user_name` VARCHAR(255) NOT NULL,
    `job_title` VARCHAR(255) NULL,
    `company_name` VARCHAR(255) NULL,
    `profile_image` MEDIUMTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_created_at`(`created_at`),
    INDEX `idx_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password` VARCHAR(255) NULL,
    `role` ENUM('USER', 'RECRUITER', 'ADMIN') NULL DEFAULT 'USER',
    `status` ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') NULL DEFAULT 'ACTIVE',
    `profile_complete` BOOLEAN NULL DEFAULT false,
    `profile_photo` VARCHAR(500) NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    `date_of_birth` DATE NULL,
    `contact_number` VARCHAR(20) NULL,
    `email_verified` BOOLEAN NULL DEFAULT false,
    `phone_verified` BOOLEAN NULL DEFAULT false,
    `current_location` VARCHAR(150) NULL,
    `permanent_address` TEXT NULL,
    `nationality` VARCHAR(100) NULL,
    `linkedin_url` VARCHAR(300) NULL,
    `github_url` VARCHAR(300) NULL,
    `portfolio_url` VARCHAR(300) NULL,
    `profile_visibility` ENUM('PUBLIC', 'PRIVATE', 'RECRUITERS_ONLY') NULL DEFAULT 'PUBLIC',
    `resume_headline` VARCHAR(255) NULL,
    `professional_summary` TEXT NULL,
    `key_highlights` TEXT NULL,
    `resume_file` VARCHAR(500) NULL,
    `employment_status` ENUM('FRESHER', 'EMPLOYED', 'UNEMPLOYED', 'STUDENT') NULL,
    `total_experience_years` INTEGER NULL DEFAULT 0,
    `total_experience_months` INTEGER NULL DEFAULT 0,
    `notice_period` INTEGER NULL,
    `current_salary` DECIMAL(12, 2) NULL,
    `expected_salary` DECIMAL(12, 2) NULL,
    `salary_confidential` BOOLEAN NULL DEFAULT false,
    `highest_qualification` VARCHAR(150) NULL,
    `degree` VARCHAR(150) NULL,
    `field_of_study` VARCHAR(150) NULL,
    `college_name` VARCHAR(200) NULL,
    `year_of_passing` YEAR NULL,
    `percentage` DECIMAL(5, 2) NULL,
    `cgpa` DECIMAL(4, 2) NULL,
    `core_skills` TEXT NULL,
    `secondary_skills` TEXT NULL,
    `tools_technologies` TEXT NULL,
    `skill_proficiency` TEXT NULL,
    `skill_experience` TEXT NULL,
    `skill_keywords` TEXT NULL,
    `projects` TEXT NULL,
    `certifications` TEXT NULL,
    `desired_job_role` VARCHAR(150) NULL,
    `preferred_locations` TEXT NULL,
    `preferred_employment_type` VARCHAR(100) NULL,
    `expected_salary_range` VARCHAR(100) NULL,
    `industry_preference` VARCHAR(150) NULL,
    `functional_area` VARCHAR(150) NULL,
    `preferred_shift` VARCHAR(100) NULL,
    `open_to_relocation` BOOLEAN NULL DEFAULT false,
    `personal_website` VARCHAR(300) NULL,
    `social_media_links` TEXT NULL,
    `recommendations` TEXT NULL,
    `languages_known` TEXT NULL,
    `hobbies_interests` TEXT NULL,
    `soft_skills` TEXT NULL,
    `personality_traits` TEXT NULL,
    `career_objective` TEXT NULL,
    `profile_completeness_percentage` INTEGER NULL DEFAULT 0,
    `last_updated` DATETIME(0) NULL,
    `profile_health` VARCHAR(100) NULL,
    `ai_resume_score` INTEGER NULL,
    `skill_gap_analysis` TEXT NULL,
    `verified_badges` TEXT NULL,
    `profile_share_link` VARCHAR(300) NULL,
    `one_click_apply_enabled` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `last_login_at` DATETIME(0) NULL,
    `last_login_device` VARCHAR(150) NULL,
    `email_notifications` BOOLEAN NULL DEFAULT true,
    `job_alerts` BOOLEAN NULL DEFAULT true,
    `google_id` VARCHAR(255) NULL,
    `login_type` ENUM('EMAIL', 'GOOGLE') NULL DEFAULT 'EMAIL',
    `relocated` BOOLEAN NULL DEFAULT false,

    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saved_companies` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `company_id` BIGINT NOT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_company`(`company_id`),
    INDEX `idx_user`(`user_id`),
    UNIQUE INDEX `uniq_user_company`(`user_id`, `company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_direct_messages` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `sender_id` BIGINT NOT NULL,
    `receiver_id` BIGINT NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_udm_created_at`(`created_at`),
    INDEX `idx_udm_pair`(`sender_id`, `receiver_id`),
    INDEX `idx_udm_receiver`(`receiver_id`),
    INDEX `idx_udm_sender`(`sender_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `application_conversations` ADD CONSTRAINT `fk_appconv_application` FOREIGN KEY (`application_id`) REFERENCES `job_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_conversations` ADD CONSTRAINT `fk_appconv_job` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_conversations` ADD CONSTRAINT `fk_appconv_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_conversations` ADD CONSTRAINT `fk_appconv_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_message_attachments` ADD CONSTRAINT `fk_app_msg_attach_message` FOREIGN KEY (`message_id`) REFERENCES `application_messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_messages` ADD CONSTRAINT `fk_app_messages_application` FOREIGN KEY (`application_id`) REFERENCES `job_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_messages` ADD CONSTRAINT `fk_app_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `application_conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_messages` ADD CONSTRAINT `fk_app_messages_job` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applications` ADD CONSTRAINT `fk_app_job` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applications` ADD CONSTRAINT `fk_app_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `banner_images` ADD CONSTRAINT `fk_banner_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `super_admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certifications` ADD CONSTRAINT `fk_certifications_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `companies` ADD CONSTRAINT `fk_companies_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_ratings` ADD CONSTRAINT `fk_company_ratings_company` FOREIGN KEY (`company_id`) REFERENCES `recruiters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_ratings` ADD CONSTRAINT `fk_company_ratings_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `introduction_videos` ADD CONSTRAINT `fk_intro_videos_application` FOREIGN KEY (`application_id`) REFERENCES `job_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `introduction_videos` ADD CONSTRAINT `fk_intro_videos_job` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `introduction_videos` ADD CONSTRAINT `fk_intro_videos_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `introduction_videos` ADD CONSTRAINT `fk_intro_videos_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `fk_job_applications_job` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `fk_job_applications_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `fk_jobs_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `fk_payments_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `fk_payments_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `fk_projects_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recruiter_activity_logs` ADD CONSTRAINT `fk_recruiter_activity_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recruiter_notifications` ADD CONSTRAINT `fk_recruiter_notifications_application` FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recruiter_notifications` ADD CONSTRAINT `fk_recruiter_notifications_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recruiter_subscriptions` ADD CONSTRAINT `fk_recruiter_subscription_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recruiter_subscriptions` ADD CONSTRAINT `fk_recruiter_subscription_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recruiter_verification_documents` ADD CONSTRAINT `fk_recruiter_docs_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resumes` ADD CONSTRAINT `fk_resumes_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_jobs` ADD CONSTRAINT `fk_saved_jobs_job` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_jobs` ADD CONSTRAINT `fk_saved_jobs_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sub_recruiters` ADD CONSTRAINT `fk_sub_recruiter_parent` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_connections` ADD CONSTRAINT `user_connections_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_connections` ADD CONSTRAINT `user_connections_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_notifications` ADD CONSTRAINT `fk_user_notifications_application` FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_notifications` ADD CONSTRAINT `fk_user_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
