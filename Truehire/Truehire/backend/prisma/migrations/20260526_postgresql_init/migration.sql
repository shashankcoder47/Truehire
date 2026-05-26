-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "favourite_notifications_type" AS ENUM ('FAV_COMPANY_NEW_JOB');

-- CreateEnum
CREATE TYPE "job_applications_status" AS ENUM ('APPLIED', 'SHORTLISTED', 'INTERVIEW', 'REJECTED', 'HIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "reset_tokens_user_type" AS ENUM ('USER', 'RECRUITER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "user_connections_status" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateEnum
CREATE TYPE "notifications_recipient_type" AS ENUM ('ALL', 'USER', 'RECRUITER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "recruiter_verification_documents_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "super_admins_status" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "users_role" AS ENUM ('USER', 'RECRUITER', 'ADMIN');

-- CreateEnum
CREATE TYPE "application_messages_sender_role" AS ENUM ('USER', 'RECRUITER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "favourite_notifications_entity_type" AS ENUM ('JOB', 'COMPANY');

-- CreateEnum
CREATE TYPE "recruiter_subscriptions_status" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING');

-- CreateEnum
CREATE TYPE "user_notifications_status" AS ENUM ('UNREAD', 'READ');

-- CreateEnum
CREATE TYPE "users_status" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "notifications_status" AS ENUM ('DRAFT', 'SENT', 'SCHEDULED', 'FAILED');

-- CreateEnum
CREATE TYPE "recruiter_subscriptions_payment_status" AS ENUM ('PAID', 'UNPAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "recruiters_role" AS ENUM ('RECRUITER', 'SUB_RECRUITER', 'ADMIN');

-- CreateEnum
CREATE TYPE "resumes_visibility" AS ENUM ('PUBLIC', 'PRIVATE', 'RECRUITERS_ONLY');

-- CreateEnum
CREATE TYPE "application_messages_receiver_role" AS ENUM ('USER', 'RECRUITER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "payments_status" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "recruiters_status" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "users_gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "application_messages_pinned_by_role" AS ENUM ('USER', 'RECRUITER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "jobs_status" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'PAUSED');

-- CreateEnum
CREATE TYPE "users_profile_visibility" AS ENUM ('PUBLIC', 'PRIVATE', 'RECRUITERS_ONLY');

-- CreateEnum
CREATE TYPE "users_employment_status" AS ENUM ('FRESHER', 'EMPLOYED', 'UNEMPLOYED', 'STUDENT');

-- CreateEnum
CREATE TYPE "recruiters_login_type" AS ENUM ('EMAIL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "recruiters_approval_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "users_login_type" AS ENUM ('EMAIL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "jobs_experience_level" AS ENUM ('ENTRY_LEVEL', 'INTERNSHIP_LEVEL', 'MID_LEVEL', 'SENIOR_LEVEL', 'EXECUTIVE_LEVEL');

-- CreateEnum
CREATE TYPE "recruiters_subscription_status" AS ENUM ('FREE', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'TRIAL', 'PAUSED');

-- CreateTable
CREATE TABLE "admins" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_conversations" (
    "id" BIGSERIAL NOT NULL,
    "application_id" BIGINT NOT NULL,
    "job_id" BIGINT NOT NULL,
    "recruiter_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "last_message_id" BIGINT,
    "last_message_at" TIMESTAMP(0),
    "recruiter_notes" TEXT,
    "user_unread_email_sent_at" TIMESTAMP(0),
    "recruiter_unread_email_sent_at" TIMESTAMP(0),
    "user_last_seen_message_id" BIGINT,
    "user_seen_at" TIMESTAMP(0),
    "recruiter_last_seen_message_id" BIGINT,
    "recruiter_seen_at" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_message_attachments" (
    "id" BIGSERIAL NOT NULL,
    "message_id" BIGINT NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_type" VARCHAR(100),
    "file_size" BIGINT,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_messages" (
    "id" BIGSERIAL NOT NULL,
    "conversation_id" BIGINT NOT NULL,
    "application_id" BIGINT NOT NULL,
    "job_id" BIGINT NOT NULL,
    "sender_id" BIGINT NOT NULL,
    "sender_role" VARCHAR(11),
    "receiver_id" BIGINT NOT NULL,
    "receiver_role" VARCHAR(11),
    "message" TEXT NOT NULL,
    "read_status" BOOLEAN DEFAULT false,
    "read_at" TIMESTAMP(0),
    "is_pinned" BOOLEAN DEFAULT false,
    "pinned_at" TIMESTAMP(0),
    "pinned_by_role" VARCHAR(11),
    "pinned_by_id" BIGINT,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" BIGSERIAL NOT NULL,
    "job_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20),
    "location" VARCHAR(150),
    "experience_level" VARCHAR(100),
    "current_salary" DECIMAL(12,2),
    "expected_salary" DECIMAL(12,2),
    "notice_period" INTEGER,
    "additional_comments" TEXT,
    "resume_path" VARCHAR(500),
    "match_score" INTEGER,
    "matched_skills" TEXT,
    "missing_skills" TEXT,
    "match_status" VARCHAR(30) DEFAULT 'MATCHED',
    "applied_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "recruiter_last_action_at" TIMESTAMP(0),
    "smart_suggestion_triggered" BOOLEAN DEFAULT false,
    "smart_timer_started_at" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banner_images" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "image_path" VARCHAR(500) NOT NULL,
    "image_url" VARCHAR(500),
    "is_active" BOOLEAN DEFAULT true,
    "display_order" INTEGER DEFAULT 0,
    "uploaded_by" BIGINT,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banner_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "certification_name" VARCHAR(200) NOT NULL,
    "issuing_organization" VARCHAR(200),
    "issue_date" DATE,
    "expiry_date" DATE,
    "credential_id" VARCHAR(150),
    "credential_url" VARCHAR(300),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" BIGSERIAL NOT NULL,
    "recruiter_id" BIGINT NOT NULL,
    "company_name" VARCHAR(200) NOT NULL,
    "company_type" VARCHAR(100),
    "industry" VARCHAR(150),
    "company_size" VARCHAR(100),
    "year_founded" INTEGER,
    "official_email" VARCHAR(150),
    "phone_number" VARCHAR(20),
    "website" VARCHAR(300),
    "headquarters_location" VARCHAR(200),
    "short_overview" TEXT,
    "detailed_description" TEXT,
    "company_logo" VARCHAR(500),
    "linkedin" VARCHAR(300),
    "instagram" VARCHAR(300),
    "facebook" VARCHAR(300),
    "profile_complete" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_ratings" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "rating" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favourite_companies" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "company_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favourite_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favourite_notifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" VARCHAR(19),
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "entity_type" VARCHAR(7) DEFAULT 'JOB',
    "entity_id" BIGINT,
    "is_read" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favourite_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "introduction_videos" (
    "id" BIGSERIAL NOT NULL,
    "application_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "job_id" BIGINT NOT NULL,
    "recruiter_id" BIGINT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_size" BIGINT,
    "duration_seconds" INTEGER,
    "uploaded_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "introduction_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" BIGSERIAL NOT NULL,
    "job_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "status" VARCHAR(11) DEFAULT 'APPLIED',
    "applied_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "total_view_seconds" INTEGER DEFAULT 0,
    "rejection_reason" TEXT,
    "recruiter_last_action_at" TIMESTAMP(0),
    "smart_timer_started_at" TIMESTAMP(0),
    "smart_suggestion_triggered" BOOLEAN DEFAULT false,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" BIGSERIAL NOT NULL,
    "recruiter_id" BIGINT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "company" VARCHAR(200),
    "location" VARCHAR(150),
    "employment_type" VARCHAR(50),
    "experience_level" VARCHAR(16),
    "salary_min" DECIMAL(12,2),
    "salary_max" DECIMAL(12,2),
    "salary_currency" VARCHAR(10) DEFAULT 'INR',
    "description" TEXT,
    "requirements" TEXT,
    "benefits" TEXT,
    "skills_required" TEXT,
    "min_experience_years" DECIMAL(4,1),
    "match_percentage" INTEGER DEFAULT 0,
    "application_deadline" DATE,
    "status" VARCHAR(6) DEFAULT 'DRAFT',
    "is_featured" BOOLEAN DEFAULT false,
    "is_urgent" BOOLEAN DEFAULT false,
    "views_count" INTEGER DEFAULT 0,
    "applications_count" INTEGER DEFAULT 0,
    "deadline_notification_sent_at" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(0),
    "company_logo" VARCHAR(500),
    "max_applicants" INTEGER,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migrations" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "run_on" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "migrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "recipient_type" VARCHAR(11),
    "recipient_ids" JSONB,
    "status" VARCHAR(9) DEFAULT 'DRAFT',
    "sent_at" TIMESTAMP(0),
    "created_by" BIGINT,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" BIGSERIAL NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "otp_code" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" BIGSERIAL NOT NULL,
    "recruiter_id" BIGINT NOT NULL,
    "plan_id" BIGINT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(10) DEFAULT 'INR',
    "payment_method" VARCHAR(100),
    "transaction_id" VARCHAR(255),
    "status" VARCHAR(8) DEFAULT 'PENDING',
    "description" TEXT,
    "invoice_url" VARCHAR(500),
    "paid_at" TIMESTAMP(0),
    "razorpay_order_id" VARCHAR(255),
    "razorpay_payment_id" VARCHAR(255),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "technologies_used" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "role_responsibility" TEXT,
    "achievements" TEXT,
    "github_link" VARCHAR(300),
    "live_link" VARCHAR(300),
    "screenshots" JSONB,
    "is_featured" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruiter_activity_logs" (
    "id" BIGSERIAL NOT NULL,
    "recruiter_id" BIGINT NOT NULL,
    "action_type" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100),
    "entity_id" BIGINT,
    "duration_seconds" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruiter_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruiter_notifications" (
    "id" BIGSERIAL NOT NULL,
    "recruiter_id" BIGINT NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "application_id" BIGINT,
    "is_read" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruiter_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruiter_subscriptions" (
    "id" BIGSERIAL NOT NULL,
    "recruiter_id" BIGINT NOT NULL,
    "plan_id" BIGINT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" VARCHAR(9) DEFAULT 'PENDING',
    "payment_status" VARCHAR(8) DEFAULT 'UNPAID',
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruiter_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruiter_verification_documents" (
    "id" BIGSERIAL NOT NULL,
    "recruiter_id" BIGINT NOT NULL,
    "doc_type" VARCHAR(100) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "status" VARCHAR(8) DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(0),
    "company_image" VARCHAR(255),

    CONSTRAINT "recruiter_verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruiters" (
    "id" BIGSERIAL NOT NULL,
    "recruiter_id" VARCHAR(100),
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password" VARCHAR(255),
    "company" VARCHAR(200),
    "role" VARCHAR(13) DEFAULT 'RECRUITER',
    "status" VARCHAR(8) DEFAULT 'ACTIVE',
    "profile_complete" BOOLEAN DEFAULT false,
    "job_post_limit" INTEGER DEFAULT 0,
    "subscription_status" VARCHAR(9),
    "subscription_expiry" DATE,
    "sub_recruiters" INTEGER DEFAULT 0,
    "company_name" VARCHAR(200),
    "company_type" VARCHAR(100),
    "category" VARCHAR(150),
    "industry" VARCHAR(150),
    "company_size" VARCHAR(100),
    "year_founded" INTEGER,
    "official_email" VARCHAR(150),
    "phone_number" VARCHAR(20),
    "website" VARCHAR(300),
    "headquarters_location" VARCHAR(200),
    "short_overview" TEXT,
    "detailed_description" TEXT,
    "company_logo" VARCHAR(500),
    "linkedin" VARCHAR(300),
    "instagram" VARCHAR(300),
    "facebook" VARCHAR(300),
    "company_profile_complete" BOOLEAN DEFAULT false,
    "company_created_at" TIMESTAMP(0),
    "company_updated_at" TIMESTAMP(0),
    "google_id" VARCHAR(255),
    "login_type" VARCHAR(6) DEFAULT 'EMAIL',
    "approval_status" VARCHAR(8) DEFAULT 'PENDING',
    "approval_rejection_reason" TEXT,
    "approval_reviewed_at" TIMESTAMP(0),
    "approval_reviewed_by" BIGINT,
    "onboarding_step" INTEGER DEFAULT 0,
    "onboarding_completed_at" TIMESTAMP(0),
    "phone_verified" BOOLEAN DEFAULT false,
    "phone_verified_at" TIMESTAMP(0),
    "is_premium" BOOLEAN DEFAULT false,
    "premium_expiry" DATE,
    "premium_expiry_at" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruiters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reset_tokens" (
    "id" BIGSERIAL NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "user_id" BIGINT NOT NULL,
    "user_type" VARCHAR(11),
    "email" VARCHAR(150) NOT NULL,
    "expires_at" TIMESTAMP(0) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_size" BIGINT,
    "file_type" VARCHAR(50),
    "visibility" VARCHAR(15) DEFAULT 'PRIVATE',
    "download_count" INTEGER DEFAULT 0,
    "is_featured" BOOLEAN DEFAULT false,
    "flagged" BOOLEAN DEFAULT false,
    "flag_reason" TEXT,
    "uploaded_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_jobs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "job_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_recruiters" (
    "id" BIGSERIAL NOT NULL,
    "recruiter_id" BIGINT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sub_recruiters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "duration_months" INTEGER NOT NULL,
    "job_post_limit" INTEGER DEFAULT 0,
    "features" JSONB,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "super_admins" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'SUPER_ADMIN',
    "status" VARCHAR(8) DEFAULT 'ACTIVE',
    "last_login" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_connections" (
    "id" BIGSERIAL NOT NULL,
    "sender_id" BIGINT NOT NULL,
    "receiver_id" BIGINT NOT NULL,
    "status" VARCHAR(8) DEFAULT 'pending',
    "pair_key" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_follows" (
    "id" BIGSERIAL NOT NULL,
    "follower_id" BIGINT NOT NULL,
    "following_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "application_id" BIGINT,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "status" VARCHAR(6) DEFAULT 'UNREAD',
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_reviews" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "rating" SMALLINT NOT NULL,
    "review_message" TEXT NOT NULL,
    "user_name" VARCHAR(255) NOT NULL,
    "job_title" VARCHAR(255),
    "company_name" VARCHAR(255),
    "profile_image" TEXT,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password" VARCHAR(255),
    "role" VARCHAR(9) DEFAULT 'USER',
    "status" VARCHAR(8) DEFAULT 'ACTIVE',
    "profile_complete" BOOLEAN DEFAULT false,
    "profile_photo" VARCHAR(500),
    "gender" VARCHAR(6),
    "date_of_birth" DATE,
    "contact_number" VARCHAR(20),
    "email_verified" BOOLEAN DEFAULT false,
    "phone_verified" BOOLEAN DEFAULT false,
    "current_location" VARCHAR(150),
    "permanent_address" TEXT,
    "nationality" VARCHAR(100),
    "linkedin_url" VARCHAR(300),
    "github_url" VARCHAR(300),
    "portfolio_url" VARCHAR(300),
    "profile_visibility" VARCHAR(15) DEFAULT 'PUBLIC',
    "resume_headline" VARCHAR(255),
    "professional_summary" TEXT,
    "key_highlights" TEXT,
    "resume_file" VARCHAR(500),
    "employment_status" VARCHAR(10),
    "total_experience_years" INTEGER DEFAULT 0,
    "total_experience_months" INTEGER DEFAULT 0,
    "notice_period" INTEGER,
    "current_salary" DECIMAL(12,2),
    "expected_salary" DECIMAL(12,2),
    "salary_confidential" BOOLEAN DEFAULT false,
    "highest_qualification" VARCHAR(150),
    "degree" VARCHAR(150),
    "field_of_study" VARCHAR(150),
    "college_name" VARCHAR(200),
    "year_of_passing" INTEGER,
    "percentage" DECIMAL(5,2),
    "cgpa" DECIMAL(4,2),
    "core_skills" TEXT,
    "secondary_skills" TEXT,
    "tools_technologies" TEXT,
    "skill_proficiency" TEXT,
    "skill_experience" TEXT,
    "skill_keywords" TEXT,
    "projects" TEXT,
    "certifications" TEXT,
    "desired_job_role" VARCHAR(150),
    "preferred_locations" TEXT,
    "preferred_employment_type" VARCHAR(100),
    "expected_salary_range" VARCHAR(100),
    "industry_preference" VARCHAR(150),
    "functional_area" VARCHAR(150),
    "preferred_shift" VARCHAR(100),
    "open_to_relocation" BOOLEAN DEFAULT false,
    "personal_website" VARCHAR(300),
    "social_media_links" TEXT,
    "recommendations" TEXT,
    "languages_known" TEXT,
    "hobbies_interests" TEXT,
    "soft_skills" TEXT,
    "personality_traits" TEXT,
    "career_objective" TEXT,
    "profile_completeness_percentage" INTEGER DEFAULT 0,
    "last_updated" TIMESTAMP(0),
    "profile_health" VARCHAR(100),
    "ai_resume_score" INTEGER,
    "skill_gap_analysis" TEXT,
    "verified_badges" TEXT,
    "profile_share_link" VARCHAR(300),
    "one_click_apply_enabled" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(0),
    "last_login_device" VARCHAR(150),
    "email_notifications" BOOLEAN DEFAULT true,
    "job_alerts" BOOLEAN DEFAULT true,
    "google_id" VARCHAR(255),
    "login_type" VARCHAR(6) DEFAULT 'EMAIL',
    "relocated" BOOLEAN DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_companies" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "company_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_direct_messages" (
    "id" BIGSERIAL NOT NULL,
    "sender_id" BIGINT NOT NULL,
    "receiver_id" BIGINT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_direct_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "idx_appconv_application" ON "application_conversations"("application_id");

-- CreateIndex
CREATE INDEX "idx_appconv_job" ON "application_conversations"("job_id");

-- CreateIndex
CREATE INDEX "idx_appconv_recruiter" ON "application_conversations"("recruiter_id");

-- CreateIndex
CREATE INDEX "idx_appconv_user" ON "application_conversations"("user_id");

-- CreateIndex
CREATE INDEX "idx_app_msg_attach_message" ON "application_message_attachments"("message_id");

-- CreateIndex
CREATE INDEX "idx_app_messages_application" ON "application_messages"("application_id");

-- CreateIndex
CREATE INDEX "idx_app_messages_conversation" ON "application_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "idx_app_messages_job" ON "application_messages"("job_id");

-- CreateIndex
CREATE INDEX "idx_app_messages_read" ON "application_messages"("read_status");

-- CreateIndex
CREATE INDEX "idx_app_messages_receiver" ON "application_messages"("receiver_id");

-- CreateIndex
CREATE INDEX "idx_app_messages_sender" ON "application_messages"("sender_id");

-- CreateIndex
CREATE INDEX "idx_app_email" ON "applications"("email");

-- CreateIndex
CREATE INDEX "idx_app_job" ON "applications"("job_id");

-- CreateIndex
CREATE INDEX "idx_app_user" ON "applications"("user_id");

-- CreateIndex
CREATE INDEX "idx_banner_uploaded_by" ON "banner_images"("uploaded_by");

-- CreateIndex
CREATE INDEX "idx_banner_active" ON "banner_images"("is_active");

-- CreateIndex
CREATE INDEX "idx_banner_display_order" ON "banner_images"("display_order");

-- CreateIndex
CREATE INDEX "idx_certifications_issue_date" ON "certifications"("issue_date");

-- CreateIndex
CREATE INDEX "idx_certifications_name" ON "certifications"("certification_name");

-- CreateIndex
CREATE INDEX "idx_certifications_user" ON "certifications"("user_id");

-- CreateIndex
CREATE INDEX "idx_companies_industry" ON "companies"("industry");

-- CreateIndex
CREATE INDEX "idx_companies_name" ON "companies"("company_name");

-- CreateIndex
CREATE INDEX "idx_companies_recruiter" ON "companies"("recruiter_id");

-- CreateIndex
CREATE INDEX "idx_company_ratings_company" ON "company_ratings"("company_id");

-- CreateIndex
CREATE INDEX "idx_company_ratings_rating" ON "company_ratings"("rating");

-- CreateIndex
CREATE INDEX "idx_company_ratings_user" ON "company_ratings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_company_user" ON "company_ratings"("company_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_favourite_companies_company" ON "favourite_companies"("company_id");

-- CreateIndex
CREATE INDEX "idx_favourite_companies_user" ON "favourite_companies"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_favourite_companies_user_company" ON "favourite_companies"("user_id", "company_id");

-- CreateIndex
CREATE INDEX "idx_created" ON "favourite_notifications"("created_at");

-- CreateIndex
CREATE INDEX "idx_read" ON "favourite_notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "idx_favourite_notifications_user" ON "favourite_notifications"("user_id");

-- CreateIndex
CREATE INDEX "idx_intro_videos_application" ON "introduction_videos"("application_id");

-- CreateIndex
CREATE INDEX "idx_intro_videos_job" ON "introduction_videos"("job_id");

-- CreateIndex
CREATE INDEX "idx_intro_videos_recruiter" ON "introduction_videos"("recruiter_id");

-- CreateIndex
CREATE INDEX "idx_intro_videos_user" ON "introduction_videos"("user_id");

-- CreateIndex
CREATE INDEX "idx_job_applications_job" ON "job_applications"("job_id");

-- CreateIndex
CREATE INDEX "idx_job_applications_status" ON "job_applications"("status");

-- CreateIndex
CREATE INDEX "idx_job_applications_user" ON "job_applications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_job_user" ON "job_applications"("job_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_jobs_location" ON "jobs"("location");

-- CreateIndex
CREATE INDEX "idx_jobs_recruiter" ON "jobs"("recruiter_id");

-- CreateIndex
CREATE INDEX "idx_jobs_status" ON "jobs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "name" ON "migrations"("name");

-- CreateIndex
CREATE INDEX "idx_migrations_name" ON "migrations"("name");

-- CreateIndex
CREATE INDEX "idx_migrations_run_on" ON "migrations"("run_on");

-- CreateIndex
CREATE INDEX "idx_notifications_recipient_type" ON "notifications"("recipient_type");

-- CreateIndex
CREATE INDEX "idx_notifications_sent_at" ON "notifications"("sent_at");

-- CreateIndex
CREATE INDEX "idx_notifications_status" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "idx_notifications_type" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "idx_otp_email" ON "otp_codes"("email");

-- CreateIndex
CREATE INDEX "idx_otp_expires" ON "otp_codes"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_id" ON "payments"("transaction_id");

-- CreateIndex
CREATE INDEX "idx_payments_plan" ON "payments"("plan_id");

-- CreateIndex
CREATE INDEX "idx_payments_recruiter" ON "payments"("recruiter_id");

-- CreateIndex
CREATE INDEX "idx_payments_status" ON "payments"("status");

-- CreateIndex
CREATE INDEX "idx_payments_transaction" ON "payments"("transaction_id");

-- CreateIndex
CREATE INDEX "idx_projects_dates" ON "projects"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "idx_projects_featured" ON "projects"("is_featured");

-- CreateIndex
CREATE INDEX "idx_projects_user" ON "projects"("user_id");

-- CreateIndex
CREATE INDEX "idx_recruiter_activity_action" ON "recruiter_activity_logs"("action_type");

-- CreateIndex
CREATE INDEX "idx_recruiter_activity_created" ON "recruiter_activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_recruiter_activity_entity" ON "recruiter_activity_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_recruiter_activity_recruiter" ON "recruiter_activity_logs"("recruiter_id");

-- CreateIndex
CREATE INDEX "idx_recruiter_notifications_application" ON "recruiter_notifications"("application_id");

-- CreateIndex
CREATE INDEX "idx_recruiter_notifications_read" ON "recruiter_notifications"("is_read");

-- CreateIndex
CREATE INDEX "idx_recruiter_notifications_recruiter" ON "recruiter_notifications"("recruiter_id");

-- CreateIndex
CREATE INDEX "idx_recruiter_subscription_plan" ON "recruiter_subscriptions"("plan_id");

-- CreateIndex
CREATE INDEX "idx_recruiter_subscription_recruiter" ON "recruiter_subscriptions"("recruiter_id");

-- CreateIndex
CREATE INDEX "idx_recruiter_subscription_status" ON "recruiter_subscriptions"("status");

-- CreateIndex
CREATE INDEX "idx_recruiter_docs_recruiter" ON "recruiter_verification_documents"("recruiter_id");

-- CreateIndex
CREATE INDEX "idx_recruiter_docs_status" ON "recruiter_verification_documents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "recruiter_id" ON "recruiters"("recruiter_id");

-- CreateIndex
CREATE UNIQUE INDEX "recruiters_email_key" ON "recruiters"("email");

-- CreateIndex
CREATE UNIQUE INDEX "token" ON "reset_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_reset_email" ON "reset_tokens"("email");

-- CreateIndex
CREATE INDEX "idx_reset_expires" ON "reset_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "idx_reset_user" ON "reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "idx_resumes_flagged" ON "resumes"("flagged");

-- CreateIndex
CREATE INDEX "idx_resumes_user" ON "resumes"("user_id");

-- CreateIndex
CREATE INDEX "idx_resumes_visibility" ON "resumes"("visibility");

-- CreateIndex
CREATE INDEX "idx_saved_jobs_job" ON "saved_jobs"("job_id");

-- CreateIndex
CREATE INDEX "idx_saved_jobs_user" ON "saved_jobs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_user_job" ON "saved_jobs"("user_id", "job_id");

-- CreateIndex
CREATE UNIQUE INDEX "sub_recruiters_email_key" ON "sub_recruiters"("email");

-- CreateIndex
CREATE INDEX "idx_sub_recruiter_parent" ON "sub_recruiters"("recruiter_id");

-- CreateIndex
CREATE INDEX "idx_subscription_active" ON "subscription_plans"("is_active");

-- CreateIndex
CREATE INDEX "idx_subscription_price" ON "subscription_plans"("price");

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_email_key" ON "super_admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_user_connections_pair" ON "user_connections"("pair_key");

-- CreateIndex
CREATE INDEX "idx_user_connections_receiver_status" ON "user_connections"("receiver_id", "status");

-- CreateIndex
CREATE INDEX "idx_user_connections_sender_status" ON "user_connections"("sender_id", "status");

-- CreateIndex
CREATE INDEX "idx_user_follows_follower" ON "user_follows"("follower_id");

-- CreateIndex
CREATE INDEX "idx_user_follows_following" ON "user_follows"("following_id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_user_follows_pair" ON "user_follows"("follower_id", "following_id");

-- CreateIndex
CREATE INDEX "idx_user_notifications_application" ON "user_notifications"("application_id");

-- CreateIndex
CREATE INDEX "idx_user_notifications_status" ON "user_notifications"("status");

-- CreateIndex
CREATE INDEX "idx_user_notifications_user" ON "user_notifications"("user_id");

-- CreateIndex
CREATE INDEX "idx_created_at" ON "user_reviews"("created_at");

-- CreateIndex
CREATE INDEX "idx_user_id" ON "user_reviews"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_saved_companies_company" ON "saved_companies"("company_id");

-- CreateIndex
CREATE INDEX "idx_saved_companies_user" ON "saved_companies"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_saved_companies_user_company" ON "saved_companies"("user_id", "company_id");

-- CreateIndex
CREATE INDEX "idx_udm_created_at" ON "user_direct_messages"("created_at");

-- CreateIndex
CREATE INDEX "idx_udm_pair" ON "user_direct_messages"("sender_id", "receiver_id");

-- CreateIndex
CREATE INDEX "idx_udm_receiver" ON "user_direct_messages"("receiver_id");

-- CreateIndex
CREATE INDEX "idx_udm_sender" ON "user_direct_messages"("sender_id");

-- AddForeignKey
ALTER TABLE "application_conversations" ADD CONSTRAINT "fk_appconv_application" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_conversations" ADD CONSTRAINT "fk_appconv_job" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_conversations" ADD CONSTRAINT "fk_appconv_recruiter" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_conversations" ADD CONSTRAINT "fk_appconv_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_message_attachments" ADD CONSTRAINT "fk_app_msg_attach_message" FOREIGN KEY ("message_id") REFERENCES "application_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_messages" ADD CONSTRAINT "fk_app_messages_application" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_messages" ADD CONSTRAINT "fk_app_messages_conversation" FOREIGN KEY ("conversation_id") REFERENCES "application_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_messages" ADD CONSTRAINT "fk_app_messages_job" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "fk_app_job" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "fk_app_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banner_images" ADD CONSTRAINT "fk_banner_uploaded_by" FOREIGN KEY ("uploaded_by") REFERENCES "super_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "fk_certifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "fk_companies_recruiter" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_ratings" ADD CONSTRAINT "fk_company_ratings_company" FOREIGN KEY ("company_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_ratings" ADD CONSTRAINT "fk_company_ratings_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "introduction_videos" ADD CONSTRAINT "fk_intro_videos_application" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "introduction_videos" ADD CONSTRAINT "fk_intro_videos_job" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "introduction_videos" ADD CONSTRAINT "fk_intro_videos_recruiter" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "introduction_videos" ADD CONSTRAINT "fk_intro_videos_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "fk_job_applications_job" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "fk_job_applications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "fk_jobs_recruiter" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "fk_payments_plan" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "fk_payments_recruiter" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "fk_projects_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_activity_logs" ADD CONSTRAINT "fk_recruiter_activity_recruiter" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_notifications" ADD CONSTRAINT "fk_recruiter_notifications_application" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_notifications" ADD CONSTRAINT "fk_recruiter_notifications_recruiter" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_subscriptions" ADD CONSTRAINT "fk_recruiter_subscription_plan" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_subscriptions" ADD CONSTRAINT "fk_recruiter_subscription_recruiter" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_verification_documents" ADD CONSTRAINT "fk_recruiter_docs_recruiter" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "fk_resumes_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "fk_saved_jobs_job" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "fk_saved_jobs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_recruiters" ADD CONSTRAINT "fk_sub_recruiter_parent" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_connections" ADD CONSTRAINT "user_connections_ibfk_1" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_connections" ADD CONSTRAINT "user_connections_ibfk_2" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "fk_user_notifications_application" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "fk_user_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Merged from 20260526_postgresql_raw_feature_tables
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
