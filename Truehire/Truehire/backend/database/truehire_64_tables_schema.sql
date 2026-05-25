-- TrueHire application database schema
-- Generated from the applied MySQL schema on 2026-05-25.
-- Contains 64 application tables; excludes migration bookkeeping tables: _prisma_migrations and mysql_migrations.

SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE `admins` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ADMIN',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `application_conversations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `application_id` bigint NOT NULL,
  `job_id` bigint NOT NULL,
  `recruiter_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `last_message_id` bigint DEFAULT NULL,
  `last_message_at` datetime DEFAULT NULL,
  `recruiter_notes` text COLLATE utf8mb4_unicode_ci,
  `user_unread_email_sent_at` datetime DEFAULT NULL,
  `recruiter_unread_email_sent_at` datetime DEFAULT NULL,
  `user_last_seen_message_id` bigint DEFAULT NULL,
  `user_seen_at` datetime DEFAULT NULL,
  `recruiter_last_seen_message_id` bigint DEFAULT NULL,
  `recruiter_seen_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_appconv_application` (`application_id`),
  KEY `idx_appconv_job` (`job_id`),
  KEY `idx_appconv_recruiter` (`recruiter_id`),
  KEY `idx_appconv_user` (`user_id`),
  CONSTRAINT `fk_appconv_application` FOREIGN KEY (`application_id`) REFERENCES `job_applications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_appconv_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_appconv_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_appconv_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `application_message_attachments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `message_id` bigint NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_app_msg_attach_message` (`message_id`),
  CONSTRAINT `fk_app_msg_attach_message` FOREIGN KEY (`message_id`) REFERENCES `application_messages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `application_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint NOT NULL,
  `application_id` bigint NOT NULL,
  `job_id` bigint NOT NULL,
  `sender_id` bigint NOT NULL,
  `sender_role` enum('USER','RECRUITER','SUPER_ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `receiver_id` bigint NOT NULL,
  `receiver_role` enum('USER','RECRUITER','SUPER_ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_status` tinyint(1) DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `is_pinned` tinyint(1) DEFAULT '0',
  `pinned_at` datetime DEFAULT NULL,
  `pinned_by_role` enum('USER','RECRUITER','SUPER_ADMIN') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pinned_by_id` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_app_messages_application` (`application_id`),
  KEY `idx_app_messages_conversation` (`conversation_id`),
  KEY `idx_app_messages_job` (`job_id`),
  KEY `idx_app_messages_read` (`read_status`),
  KEY `idx_app_messages_receiver` (`receiver_id`),
  KEY `idx_app_messages_sender` (`sender_id`),
  CONSTRAINT `fk_app_messages_application` FOREIGN KEY (`application_id`) REFERENCES `job_applications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_app_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `application_conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_app_messages_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `applications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `job_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `experience_level` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `current_salary` decimal(12,2) DEFAULT NULL,
  `expected_salary` decimal(12,2) DEFAULT NULL,
  `notice_period` int DEFAULT NULL,
  `additional_comments` text COLLATE utf8mb4_unicode_ci,
  `resume_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `match_score` int DEFAULT NULL,
  `matched_skills` text COLLATE utf8mb4_unicode_ci,
  `missing_skills` text COLLATE utf8mb4_unicode_ci,
  `match_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MATCHED',
  `applied_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `recruiter_last_action_at` datetime DEFAULT NULL,
  `smart_suggestion_triggered` tinyint(1) DEFAULT '0',
  `smart_timer_started_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_app_email` (`email`),
  KEY `idx_app_job` (`job_id`),
  KEY `idx_app_user` (`user_id`),
  KEY `idx_app_match_status` (`match_status`),
  CONSTRAINT `fk_app_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_app_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `banner_images` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `display_order` int DEFAULT '0',
  `uploaded_by` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_banner_uploaded_by` (`uploaded_by`),
  KEY `idx_banner_active` (`is_active`),
  KEY `idx_banner_display_order` (`display_order`),
  CONSTRAINT `fk_banner_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `super_admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `certifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `certification_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issuing_organization` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `credential_id` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `credential_url` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_certifications_issue_date` (`issue_date`),
  KEY `idx_certifications_name` (`certification_name`),
  KEY `idx_certifications_user` (`user_id`),
  CONSTRAINT `fk_certifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `companies` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `recruiter_id` bigint NOT NULL,
  `company_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `industry` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_size` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year_founded` year DEFAULT NULL,
  `official_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `headquarters_location` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `short_overview` text COLLATE utf8mb4_unicode_ci,
  `detailed_description` text COLLATE utf8mb4_unicode_ci,
  `company_logo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linkedin` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instagram` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `facebook` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_complete` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_companies_industry` (`industry`),
  KEY `idx_companies_name` (`company_name`),
  KEY `idx_companies_recruiter` (`recruiter_id`),
  CONSTRAINT `fk_companies_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `company_followers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `company_id` bigint NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_company` (`user_id`,`company_id`),
  KEY `idx_company_followers_user_id` (`user_id`),
  KEY `idx_company_followers_company_id` (`company_id`),
  CONSTRAINT `fk_company_followers_company` FOREIGN KEY (`company_id`) REFERENCES `recruiters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_company_followers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `company_network` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `company_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_company_network_user_company` (`user_id`,`company_id`),
  KEY `idx_company_network_company_id` (`company_id`),
  KEY `idx_company_network_user_id` (`user_id`),
  CONSTRAINT `fk_company_network_company` FOREIGN KEY (`company_id`) REFERENCES `recruiters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_company_network_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `company_post_media` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `post_id` bigint unsigned NOT NULL,
  `media_url` varchar(1000) NOT NULL,
  `media_type` varchar(30) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_company_post_media_post_order` (`post_id`,`sort_order`),
  CONSTRAINT `fk_company_post_media_post` FOREIGN KEY (`post_id`) REFERENCES `company_posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `company_post_views` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `post_id` bigint unsigned NOT NULL,
  `user_id` bigint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_company_post_views_user_post` (`post_id`,`user_id`),
  KEY `idx_company_post_views_post_id` (`post_id`),
  KEY `idx_company_post_views_user_id` (`user_id`),
  CONSTRAINT `fk_company_post_views_post` FOREIGN KEY (`post_id`) REFERENCES `company_posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_company_post_views_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `company_posts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `recruiter_id` bigint NOT NULL,
  `company_id` bigint NOT NULL,
  `caption` text,
  `media_url` varchar(1000) DEFAULT NULL,
  `media_type` varchar(30) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_company_posts_company_created` (`company_id`,`created_at`),
  KEY `idx_company_posts_recruiter_id` (`recruiter_id`),
  KEY `idx_company_posts_status_created` (`status`,`created_at`),
  CONSTRAINT `fk_company_posts_company` FOREIGN KEY (`company_id`) REFERENCES `recruiters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_company_posts_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `company_ratings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `company_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `rating` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_company_user` (`company_id`,`user_id`),
  KEY `idx_company_ratings_company` (`company_id`),
  KEY `idx_company_ratings_rating` (`rating`),
  KEY `idx_company_ratings_user` (`user_id`),
  CONSTRAINT `fk_company_ratings_company` FOREIGN KEY (`company_id`) REFERENCES `recruiters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_company_ratings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `company_status_views` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `status_id` bigint unsigned NOT NULL,
  `user_id` bigint NOT NULL,
  `viewed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_company_status_view_user` (`status_id`,`user_id`),
  KEY `idx_company_status_views_status_id` (`status_id`),
  KEY `idx_company_status_views_user_id` (`user_id`),
  CONSTRAINT `fk_company_status_views_status` FOREIGN KEY (`status_id`) REFERENCES `company_statuses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_company_status_views_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `company_statuses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `recruiter_id` bigint NOT NULL,
  `company_id` bigint NOT NULL,
  `media_url` varchar(1000) NOT NULL,
  `media_type` varchar(30) NOT NULL,
  `caption` text,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_company_statuses_company_created` (`company_id`,`created_at`),
  KEY `idx_company_statuses_recruiter_id` (`recruiter_id`),
  KEY `idx_company_statuses_active_expiry` (`status`,`expires_at`,`created_at`),
  CONSTRAINT `fk_company_statuses_company` FOREIGN KEY (`company_id`) REFERENCES `recruiters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_company_statuses_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `education` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `qualification` varchar(200) DEFAULT NULL,
  `degree` varchar(200) DEFAULT NULL,
  `field_of_study` varchar(200) DEFAULT NULL,
  `college_name` varchar(200) DEFAULT NULL,
  `year_of_passing` int DEFAULT NULL,
  `percentage` decimal(5,2) DEFAULT NULL,
  `cgpa` decimal(4,2) DEFAULT NULL,
  `certificate_file` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_education_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `favourite_companies` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `company_id` bigint NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_company` (`user_id`,`company_id`),
  KEY `idx_company` (`company_id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `favourite_notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `type` enum('FAV_COMPANY_NEW_JOB') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` enum('JOB','COMPANY') COLLATE utf8mb4_unicode_ci DEFAULT 'JOB',
  `entity_id` bigint DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_read` (`user_id`,`is_read`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `introduction_videos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `application_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `job_id` bigint NOT NULL,
  `recruiter_id` bigint NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint DEFAULT NULL,
  `duration_seconds` int DEFAULT NULL,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_intro_videos_application` (`application_id`),
  KEY `idx_intro_videos_job` (`job_id`),
  KEY `idx_intro_videos_recruiter` (`recruiter_id`),
  KEY `idx_intro_videos_user` (`user_id`),
  CONSTRAINT `fk_intro_videos_application` FOREIGN KEY (`application_id`) REFERENCES `job_applications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_intro_videos_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_intro_videos_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_intro_videos_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_applications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `job_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `status` enum('APPLIED','SHORTLISTED','INTERVIEW','REJECTED','HIRED','WITHDRAWN') COLLATE utf8mb4_unicode_ci DEFAULT 'APPLIED',
  `applied_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `total_view_seconds` int DEFAULT '0',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `recruiter_last_action_at` datetime DEFAULT NULL,
  `smart_timer_started_at` datetime DEFAULT NULL,
  `smart_suggestion_triggered` tinyint(1) DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_job_user` (`job_id`,`user_id`),
  KEY `idx_job_applications_job` (`job_id`),
  KEY `idx_job_applications_status` (`status`),
  KEY `idx_job_applications_user` (`user_id`),
  CONSTRAINT `fk_job_applications_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_job_applications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_recommendation_emails` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `job_id` bigint unsigned NOT NULL,
  `sent_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_job_recommendation_email` (`user_id`,`job_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `job_views` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `job_id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `viewer_ip` varchar(100) DEFAULT NULL,
  `viewer_fingerprint` varchar(255) DEFAULT NULL,
  `device_fingerprint` varchar(255) DEFAULT NULL,
  `viewed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_job_views_job_id` (`job_id`),
  KEY `idx_job_views_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `jobs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `recruiter_id` bigint NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employment_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `experience_level` enum('ENTRY_LEVEL','INTERNSHIP_LEVEL','MID_LEVEL','SENIOR_LEVEL','EXECUTIVE_LEVEL') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary_min` decimal(12,2) DEFAULT NULL,
  `salary_max` decimal(12,2) DEFAULT NULL,
  `salary_currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'INR',
  `description` text COLLATE utf8mb4_unicode_ci,
  `requirements` text COLLATE utf8mb4_unicode_ci,
  `benefits` text COLLATE utf8mb4_unicode_ci,
  `skills_required` text COLLATE utf8mb4_unicode_ci,
  `min_experience_years` decimal(4,1) DEFAULT NULL,
  `match_percentage` int NOT NULL DEFAULT '0',
  `application_deadline` date DEFAULT NULL,
  `status` enum('DRAFT','OPEN','CLOSED','PAUSED') COLLATE utf8mb4_unicode_ci DEFAULT 'DRAFT',
  `is_featured` tinyint(1) DEFAULT '0',
  `is_urgent` tinyint(1) DEFAULT '0',
  `views_count` int DEFAULT '0',
  `applications_count` int DEFAULT '0',
  `deadline_notification_sent_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` datetime DEFAULT NULL,
  `company_logo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `max_applicants` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_jobs_location` (`location`),
  KEY `idx_jobs_recruiter` (`recruiter_id`),
  KEY `idx_jobs_status` (`status`),
  CONSTRAINT `fk_jobs_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=249 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `run_on` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_migrations_name` (`name`),
  KEY `idx_migrations_run_on` (`run_on`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_type` enum('ALL','USER','RECRUITER','SUPER_ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_ids` json DEFAULT NULL,
  `status` enum('DRAFT','SENT','SCHEDULED','FAILED') COLLATE utf8mb4_unicode_ci DEFAULT 'DRAFT',
  `sent_at` datetime DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_recipient_type` (`recipient_type`),
  KEY `idx_notifications_sent_at` (`sent_at`),
  KEY `idx_notifications_status` (`status`),
  KEY `idx_notifications_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `otp_codes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `otp_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_otp_email` (`email`),
  KEY `idx_otp_expires` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `recruiter_id` bigint NOT NULL,
  `plan_id` bigint DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'INR',
  `payment_method` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','SUCCESS','FAILED','REFUNDED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `description` text COLLATE utf8mb4_unicode_ci,
  `invoice_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `razorpay_order_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `razorpay_payment_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `idx_payments_plan` (`plan_id`),
  KEY `idx_payments_recruiter` (`recruiter_id`),
  KEY `idx_payments_status` (`status`),
  KEY `idx_payments_transaction` (`transaction_id`),
  CONSTRAINT `fk_payments_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_payments_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `post_comment_likes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `comment_id` bigint unsigned NOT NULL,
  `user_id` bigint NOT NULL,
  `author_role` varchar(30) NOT NULL DEFAULT 'USER',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_post_comment_likes_user_comment` (`comment_id`,`user_id`,`author_role`),
  KEY `idx_post_comment_likes_comment_id` (`comment_id`),
  KEY `idx_post_comment_likes_user_id` (`user_id`),
  CONSTRAINT `fk_post_comment_likes_comment` FOREIGN KEY (`comment_id`) REFERENCES `post_comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `post_comments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `post_id` bigint unsigned NOT NULL,
  `user_id` bigint NOT NULL,
  `author_role` varchar(30) NOT NULL DEFAULT 'USER',
  `parent_comment_id` bigint unsigned DEFAULT NULL,
  `comment` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_post_comments_post_id_created` (`post_id`,`created_at`),
  KEY `idx_post_comments_user_id` (`user_id`),
  KEY `idx_post_comments_parent_created` (`parent_comment_id`,`created_at`),
  CONSTRAINT `fk_post_comments_parent` FOREIGN KEY (`parent_comment_id`) REFERENCES `post_comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_post_comments_post` FOREIGN KEY (`post_id`) REFERENCES `company_posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `post_likes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `post_id` bigint unsigned NOT NULL,
  `user_id` bigint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_post_likes_user_post` (`post_id`,`user_id`),
  KEY `idx_post_likes_post_id` (`post_id`),
  KEY `idx_post_likes_user_id` (`user_id`),
  CONSTRAINT `fk_post_likes_post` FOREIGN KEY (`post_id`) REFERENCES `company_posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_post_likes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `projects` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `technologies_used` text COLLATE utf8mb4_unicode_ci,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `role_responsibility` text COLLATE utf8mb4_unicode_ci,
  `achievements` text COLLATE utf8mb4_unicode_ci,
  `github_link` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `live_link` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `screenshots` json DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_projects_dates` (`start_date`,`end_date`),
  KEY `idx_projects_featured` (`is_featured`),
  KEY `idx_projects_user` (`user_id`),
  CONSTRAINT `fk_projects_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pulse_updates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `type` varchar(80) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pulse_updates_user_read_created` (`user_id`,`is_read`,`created_at`),
  CONSTRAINT `fk_pulse_updates_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `recruiter_activity_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `recruiter_id` bigint NOT NULL,
  `action_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` bigint DEFAULT NULL,
  `duration_seconds` int DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_recruiter_activity_action` (`action_type`),
  KEY `idx_recruiter_activity_created` (`created_at`),
  KEY `idx_recruiter_activity_entity` (`entity_type`,`entity_id`),
  KEY `idx_recruiter_activity_recruiter` (`recruiter_id`),
  CONSTRAINT `fk_recruiter_activity_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `recruiter_notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `recruiter_id` bigint NOT NULL,
  `type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `application_id` bigint DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_recruiter_notifications_application` (`application_id`),
  KEY `idx_recruiter_notifications_read` (`is_read`),
  KEY `idx_recruiter_notifications_recruiter` (`recruiter_id`),
  CONSTRAINT `fk_recruiter_notifications_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_recruiter_notifications_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `recruiter_subscriptions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `recruiter_id` bigint NOT NULL,
  `plan_id` bigint NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('ACTIVE','EXPIRED','CANCELLED','PENDING') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `payment_status` enum('PAID','UNPAID','FAILED','REFUNDED') COLLATE utf8mb4_unicode_ci DEFAULT 'UNPAID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_recruiter_subscription_plan` (`plan_id`),
  KEY `idx_recruiter_subscription_recruiter` (`recruiter_id`),
  KEY `idx_recruiter_subscription_status` (`status`),
  CONSTRAINT `fk_recruiter_subscription_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_recruiter_subscription_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `recruiter_verification_documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `recruiter_id` bigint NOT NULL,
  `doc_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` datetime DEFAULT NULL,
  `company_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_recruiter_docs_recruiter` (`recruiter_id`),
  KEY `idx_recruiter_docs_status` (`status`),
  CONSTRAINT `fk_recruiter_docs_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `recruiters` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `recruiter_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('RECRUITER','SUB_RECRUITER','ADMIN') COLLATE utf8mb4_unicode_ci DEFAULT 'RECRUITER',
  `status` enum('ACTIVE','INACTIVE','BLOCKED') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `profile_complete` tinyint(1) DEFAULT '0',
  `job_post_limit` int DEFAULT '0',
  `subscription_status` enum('FREE','ACTIVE','EXPIRED','CANCELLED','TRIAL','PAUSED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subscription_expiry` date DEFAULT NULL,
  `sub_recruiters` int DEFAULT '0',
  `company_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `industry` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_size` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year_founded` year DEFAULT NULL,
  `official_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `headquarters_location` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `short_overview` text COLLATE utf8mb4_unicode_ci,
  `detailed_description` text COLLATE utf8mb4_unicode_ci,
  `company_logo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linkedin` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instagram` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `facebook` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_profile_complete` tinyint(1) DEFAULT '0',
  `company_created_at` datetime DEFAULT NULL,
  `company_updated_at` datetime DEFAULT NULL,
  `google_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `login_type` enum('EMAIL','GOOGLE') COLLATE utf8mb4_unicode_ci DEFAULT 'EMAIL',
  `approval_status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `approval_rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `approval_reviewed_at` datetime DEFAULT NULL,
  `approval_reviewed_by` bigint DEFAULT NULL,
  `onboarding_step` int DEFAULT '0',
  `onboarding_completed_at` datetime DEFAULT NULL,
  `phone_verified` tinyint(1) DEFAULT '0',
  `phone_verified_at` datetime DEFAULT NULL,
  `is_premium` tinyint(1) DEFAULT '0',
  `premium_expiry` date DEFAULT NULL,
  `premium_expiry_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `recruiter_id` (`recruiter_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reset_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  `user_type` enum('USER','RECRUITER','SUPER_ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_reset_email` (`email`),
  KEY `idx_reset_expires` (`expires_at`),
  KEY `idx_reset_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `resumes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint DEFAULT NULL,
  `file_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visibility` enum('PUBLIC','PRIVATE','RECRUITERS_ONLY') COLLATE utf8mb4_unicode_ci DEFAULT 'PRIVATE',
  `download_count` int DEFAULT '0',
  `is_featured` tinyint(1) DEFAULT '0',
  `flagged` tinyint(1) DEFAULT '0',
  `flag_reason` text COLLATE utf8mb4_unicode_ci,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_resumes_flagged` (`flagged`),
  KEY `idx_resumes_user` (`user_id`),
  KEY `idx_resumes_visibility` (`visibility`),
  CONSTRAINT `fk_resumes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `saved_companies` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `company_id` bigint NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_company` (`user_id`,`company_id`),
  KEY `idx_company` (`company_id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `saved_jobs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `job_id` bigint NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_job` (`user_id`,`job_id`),
  KEY `idx_saved_jobs_job` (`job_id`),
  KEY `idx_saved_jobs_user` (`user_id`),
  CONSTRAINT `fk_saved_jobs_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_saved_jobs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sub_recruiters` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `recruiter_id` bigint NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_sub_recruiter_parent` (`recruiter_id`),
  CONSTRAINT `fk_sub_recruiter_parent` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `subscription_plans` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(12,2) NOT NULL,
  `duration_months` int NOT NULL,
  `job_post_limit` int DEFAULT '0',
  `features` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_subscription_active` (`is_active`),
  KEY `idx_subscription_price` (`price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `super_admins` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','INACTIVE','BLOCKED') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SUPER_ADMIN',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `support_tickets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `recruiter_id` bigint DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `description` text,
  `status` varchar(50) DEFAULT 'open',
  `priority` varchar(50) DEFAULT 'medium',
  `assigned_to` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_support_tickets_user_id` (`user_id`),
  KEY `idx_support_tickets_recruiter_id` (`recruiter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_company_message_access` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `recruiter_id` bigint NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `expires_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_company_message_access` (`user_id`,`recruiter_id`),
  KEY `idx_ucma_user_status` (`user_id`,`status`),
  KEY `idx_ucma_recruiter_status` (`recruiter_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_company_message_payments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `recruiter_id` bigint NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'INR',
  `payment_method` varchar(50) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `razorpay_order_id` varchar(255) DEFAULT NULL,
  `razorpay_payment_id` varchar(255) DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ucmp_user_recruiter` (`user_id`,`recruiter_id`),
  KEY `idx_ucmp_razorpay_order` (`razorpay_order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_connections` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sender_id` bigint NOT NULL,
  `receiver_id` bigint NOT NULL,
  `status` enum('pending','accepted','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `pair_key` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_connections_pair` (`pair_key`),
  KEY `idx_user_connections_receiver_status` (`receiver_id`,`status`),
  KEY `idx_user_connections_sender_status` (`sender_id`,`status`),
  CONSTRAINT `user_connections_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_connections_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_direct_conversation_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint NOT NULL,
  `sender_id` bigint NOT NULL,
  `sender_type` varchar(30) NOT NULL DEFAULT 'USER',
  `receiver_id` bigint NOT NULL,
  `receiver_type` varchar(30) NOT NULL DEFAULT 'USER',
  `message` text NOT NULL,
  `reply_to_message_id` bigint DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `edited_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_direct_message_conversation` (`conversation_id`),
  KEY `idx_direct_message_receiver_read` (`receiver_id`,`is_read`),
  KEY `idx_direct_message_created` (`created_at`),
  KEY `idx_direct_message_reply_to` (`reply_to_message_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_direct_conversations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user1_id` bigint NOT NULL,
  `user1_type` varchar(30) NOT NULL DEFAULT 'USER',
  `user2_id` bigint NOT NULL,
  `user2_type` varchar(30) NOT NULL DEFAULT 'USER',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_direct_conversation_typed_pair` (`user1_id`,`user1_type`,`user2_id`,`user2_type`),
  KEY `idx_direct_conversation_user1` (`user1_id`),
  KEY `idx_direct_conversation_user2` (`user2_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_direct_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sender_id` bigint NOT NULL,
  `receiver_id` bigint NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_udm_created_at` (`created_at`),
  KEY `idx_udm_pair` (`sender_id`,`receiver_id`),
  KEY `idx_udm_receiver` (`receiver_id`),
  KEY `idx_udm_sender` (`sender_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_follows` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `follower_id` bigint NOT NULL,
  `following_id` bigint NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_follows_pair` (`follower_id`,`following_id`),
  KEY `idx_user_follows_follower` (`follower_id`),
  KEY `idx_user_follows_following` (`following_id`),
  CONSTRAINT `fk_user_follows_follower` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_follows_following` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `application_id` bigint DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `metadata` json DEFAULT NULL,
  `status` enum('UNREAD','READ') COLLATE utf8mb4_unicode_ci DEFAULT 'UNREAD',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_notifications_application` (`application_id`),
  KEY `idx_user_notifications_status` (`status`),
  KEY `idx_user_notifications_user` (`user_id`),
  CONSTRAINT `fk_user_notifications_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=173 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_post_comment_likes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `comment_id` bigint unsigned NOT NULL,
  `user_id` bigint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_post_comment_likes_user_comment` (`comment_id`,`user_id`),
  KEY `idx_user_post_comment_likes_comment_id` (`comment_id`),
  KEY `idx_user_post_comment_likes_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_post_comments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `post_id` bigint unsigned NOT NULL,
  `user_id` bigint NOT NULL,
  `parent_comment_id` bigint unsigned DEFAULT NULL,
  `comment` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_post_comments_post_created` (`post_id`,`created_at`),
  KEY `idx_user_post_comments_parent_created` (`parent_comment_id`,`created_at`),
  KEY `idx_user_post_comments_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_post_likes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `post_id` bigint unsigned NOT NULL,
  `user_id` bigint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_post_likes_user_post` (`post_id`,`user_id`),
  KEY `idx_user_post_likes_post_id` (`post_id`),
  KEY `idx_user_post_likes_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_post_media` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `post_id` bigint unsigned NOT NULL,
  `media_url` varchar(1000) NOT NULL,
  `media_type` varchar(30) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_post_media_post_order` (`post_id`,`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_post_shares` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `post_id` bigint unsigned NOT NULL,
  `user_id` bigint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_post_shares_post_id` (`post_id`),
  KEY `idx_user_post_shares_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_posts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `caption` text,
  `media_url` varchar(1000) DEFAULT NULL,
  `media_type` varchar(30) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_posts_user_created` (`user_id`,`created_at`),
  KEY `idx_user_posts_status_created` (`status`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `rating` tinyint NOT NULL,
  `review_message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `job_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_image` mediumtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('USER','RECRUITER','ADMIN') COLLATE utf8mb4_unicode_ci DEFAULT 'USER',
  `status` enum('ACTIVE','INACTIVE','BLOCKED') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `profile_complete` tinyint(1) DEFAULT '0',
  `profile_photo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('MALE','FEMALE','OTHER') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `contact_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT '0',
  `phone_verified` tinyint(1) DEFAULT '0',
  `current_location` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permanent_address` text COLLATE utf8mb4_unicode_ci,
  `nationality` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linkedin_url` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `github_url` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `portfolio_url` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_visibility` enum('PUBLIC','PRIVATE','RECRUITERS_ONLY') COLLATE utf8mb4_unicode_ci DEFAULT 'PUBLIC',
  `resume_headline` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `professional_summary` text COLLATE utf8mb4_unicode_ci,
  `key_highlights` text COLLATE utf8mb4_unicode_ci,
  `resume_file` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employment_status` enum('FRESHER','EMPLOYED','UNEMPLOYED','STUDENT') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_experience_years` int DEFAULT '0',
  `total_experience_months` int DEFAULT '0',
  `notice_period` int DEFAULT NULL,
  `current_salary` decimal(12,2) DEFAULT NULL,
  `expected_salary` decimal(12,2) DEFAULT NULL,
  `salary_confidential` tinyint(1) DEFAULT '0',
  `highest_qualification` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `degree` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_of_study` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `college_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year_of_passing` year DEFAULT NULL,
  `percentage` decimal(5,2) DEFAULT NULL,
  `cgpa` decimal(4,2) DEFAULT NULL,
  `core_skills` text COLLATE utf8mb4_unicode_ci,
  `secondary_skills` text COLLATE utf8mb4_unicode_ci,
  `tools_technologies` text COLLATE utf8mb4_unicode_ci,
  `skill_proficiency` text COLLATE utf8mb4_unicode_ci,
  `skill_experience` text COLLATE utf8mb4_unicode_ci,
  `skill_keywords` text COLLATE utf8mb4_unicode_ci,
  `projects` text COLLATE utf8mb4_unicode_ci,
  `certifications` text COLLATE utf8mb4_unicode_ci,
  `desired_job_role` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferred_locations` text COLLATE utf8mb4_unicode_ci,
  `preferred_employment_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expected_salary_range` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `industry_preference` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `functional_area` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferred_shift` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `open_to_relocation` tinyint(1) DEFAULT '0',
  `personal_website` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `social_media_links` text COLLATE utf8mb4_unicode_ci,
  `recommendations` text COLLATE utf8mb4_unicode_ci,
  `languages_known` text COLLATE utf8mb4_unicode_ci,
  `hobbies_interests` text COLLATE utf8mb4_unicode_ci,
  `soft_skills` text COLLATE utf8mb4_unicode_ci,
  `personality_traits` text COLLATE utf8mb4_unicode_ci,
  `career_objective` text COLLATE utf8mb4_unicode_ci,
  `profile_completeness_percentage` int DEFAULT '0',
  `last_updated` datetime DEFAULT NULL,
  `profile_health` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ai_resume_score` int DEFAULT NULL,
  `skill_gap_analysis` text COLLATE utf8mb4_unicode_ci,
  `verified_badges` text COLLATE utf8mb4_unicode_ci,
  `profile_share_link` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `one_click_apply_enabled` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login_at` datetime DEFAULT NULL,
  `last_login_device` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_notifications` tinyint(1) DEFAULT '1',
  `job_alerts` tinyint(1) DEFAULT '1',
  `google_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `login_type` enum('EMAIL','GOOGLE') COLLATE utf8mb4_unicode_ci DEFAULT 'EMAIL',
  `relocated` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `weekly_job_alert_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `week_start_date` date NOT NULL,
  `job_count` int NOT NULL DEFAULT '0',
  `sent_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_weekly_job_alert_user_week` (`user_id`,`week_start_date`),
  KEY `idx_weekly_job_alert_sent_at` (`sent_at`),
  CONSTRAINT `fk_weekly_job_alert_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `work_experience` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `company_name` varchar(200) DEFAULT NULL,
  `job_title` varchar(200) DEFAULT NULL,
  `employment_type` varchar(100) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_current` tinyint(1) DEFAULT '0',
  `location` varchar(200) DEFAULT NULL,
  `job_description` text,
  `achievements` text,
  `technologies_used` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_work_experience_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS=1;
