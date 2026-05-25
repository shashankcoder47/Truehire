CREATE TABLE IF NOT EXISTS company_post_media (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT UNSIGNED NOT NULL,
  media_url VARCHAR(1000) NOT NULL,
  media_type VARCHAR(30) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_company_post_media_post_order (post_id, sort_order)
);

CREATE TABLE IF NOT EXISTS user_posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  caption TEXT NULL,
  media_url VARCHAR(1000) NULL,
  media_type VARCHAR(30) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_posts_user_created (user_id, created_at),
  INDEX idx_user_posts_status_created (status, created_at)
);

CREATE TABLE IF NOT EXISTS user_post_media (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT UNSIGNED NOT NULL,
  media_url VARCHAR(1000) NOT NULL,
  media_type VARCHAR(30) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_post_media_post_order (post_id, sort_order)
);

CREATE TABLE IF NOT EXISTS user_post_likes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_post_likes_user_post (post_id, user_id),
  INDEX idx_user_post_likes_post_id (post_id),
  INDEX idx_user_post_likes_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS user_post_comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT NOT NULL,
  parent_comment_id BIGINT UNSIGNED NULL,
  comment TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_post_comments_post_created (post_id, created_at),
  INDEX idx_user_post_comments_parent_created (parent_comment_id, created_at),
  INDEX idx_user_post_comments_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS user_post_comment_likes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  comment_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_post_comment_likes_user_comment (comment_id, user_id),
  INDEX idx_user_post_comment_likes_comment_id (comment_id),
  INDEX idx_user_post_comment_likes_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS user_post_shares (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_post_shares_post_id (post_id),
  INDEX idx_user_post_shares_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS user_direct_conversations (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user1_id BIGINT NOT NULL,
  user2_id BIGINT NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_direct_conversation_pair (user1_id, user2_id),
  KEY idx_direct_conversation_user1 (user1_id),
  KEY idx_direct_conversation_user2 (user2_id)
);

CREATE TABLE IF NOT EXISTS user_direct_conversation_messages (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  sender_id BIGINT NOT NULL,
  receiver_id BIGINT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_direct_message_conversation (conversation_id),
  KEY idx_direct_message_receiver_read (receiver_id, is_read),
  KEY idx_direct_message_created (created_at)
);

DELETE cpm FROM company_post_media cpm LEFT JOIN company_posts cp ON cp.id = cpm.post_id WHERE cp.id IS NULL;
DELETE pl FROM post_likes pl LEFT JOIN company_posts cp ON cp.id = pl.post_id LEFT JOIN users u ON u.id = pl.user_id WHERE cp.id IS NULL OR u.id IS NULL;
DELETE pcl FROM post_comment_likes pcl LEFT JOIN post_comments pc ON pc.id = pcl.comment_id WHERE pc.id IS NULL;
DELETE pc_child FROM post_comments pc_child LEFT JOIN post_comments pc_parent ON pc_parent.id = pc_child.parent_comment_id WHERE pc_child.parent_comment_id IS NOT NULL AND pc_parent.id IS NULL;
DELETE pc FROM post_comments pc LEFT JOIN company_posts cp ON cp.id = pc.post_id WHERE cp.id IS NULL;
DELETE cpv FROM company_post_views cpv LEFT JOIN company_posts cp ON cp.id = cpv.post_id LEFT JOIN users u ON u.id = cpv.user_id WHERE cp.id IS NULL OR u.id IS NULL;
DELETE cp FROM company_posts cp LEFT JOIN recruiters r1 ON r1.id = cp.recruiter_id LEFT JOIN recruiters r2 ON r2.id = cp.company_id WHERE r1.id IS NULL OR r2.id IS NULL;
DELETE cpm FROM company_post_media cpm LEFT JOIN company_posts cp ON cp.id = cpm.post_id WHERE cp.id IS NULL;
DELETE pl FROM post_likes pl LEFT JOIN company_posts cp ON cp.id = pl.post_id LEFT JOIN users u ON u.id = pl.user_id WHERE cp.id IS NULL OR u.id IS NULL;
DELETE pcl FROM post_comment_likes pcl LEFT JOIN post_comments pc ON pc.id = pcl.comment_id WHERE pc.id IS NULL;
DELETE pc FROM post_comments pc LEFT JOIN company_posts cp ON cp.id = pc.post_id WHERE cp.id IS NULL;
DELETE cpv FROM company_post_views cpv LEFT JOIN company_posts cp ON cp.id = cpv.post_id LEFT JOIN users u ON u.id = cpv.user_id WHERE cp.id IS NULL OR u.id IS NULL;
DELETE cn FROM company_network cn LEFT JOIN recruiters r ON r.id = cn.company_id LEFT JOIN users u ON u.id = cn.user_id WHERE r.id IS NULL OR u.id IS NULL;
DELETE cf FROM company_followers cf LEFT JOIN recruiters r ON r.id = cf.company_id LEFT JOIN users u ON u.id = cf.user_id WHERE r.id IS NULL OR u.id IS NULL;
DELETE cst FROM company_status_views cst LEFT JOIN company_statuses cs ON cs.id = cst.status_id LEFT JOIN users u ON u.id = cst.user_id WHERE cs.id IS NULL OR u.id IS NULL;
DELETE cs FROM company_statuses cs LEFT JOIN recruiters r1 ON r1.id = cs.recruiter_id LEFT JOIN recruiters r2 ON r2.id = cs.company_id WHERE r1.id IS NULL OR r2.id IS NULL;
DELETE pu FROM pulse_updates pu LEFT JOIN users u ON u.id = pu.user_id WHERE u.id IS NULL;
DELETE wjal FROM weekly_job_alert_logs wjal LEFT JOIN users u ON u.id = wjal.user_id WHERE u.id IS NULL;
DELETE upm FROM user_post_media upm LEFT JOIN user_posts up ON up.id = upm.post_id WHERE up.id IS NULL;
DELETE upl FROM user_post_likes upl LEFT JOIN user_posts up ON up.id = upl.post_id LEFT JOIN users u ON u.id = upl.user_id WHERE up.id IS NULL OR u.id IS NULL;
DELETE upcl FROM user_post_comment_likes upcl LEFT JOIN user_post_comments upc ON upc.id = upcl.comment_id LEFT JOIN users u ON u.id = upcl.user_id WHERE upc.id IS NULL OR u.id IS NULL;
DELETE upc_child FROM user_post_comments upc_child LEFT JOIN user_post_comments upc_parent ON upc_parent.id = upc_child.parent_comment_id WHERE upc_child.parent_comment_id IS NOT NULL AND upc_parent.id IS NULL;
DELETE upc FROM user_post_comments upc LEFT JOIN user_posts up ON up.id = upc.post_id LEFT JOIN users u ON u.id = upc.user_id WHERE up.id IS NULL OR u.id IS NULL;
DELETE ups FROM user_post_shares ups LEFT JOIN user_posts up ON up.id = ups.post_id LEFT JOIN users u ON u.id = ups.user_id WHERE up.id IS NULL OR u.id IS NULL;
DELETE up FROM user_posts up LEFT JOIN users u ON u.id = up.user_id WHERE u.id IS NULL;
DELETE upm FROM user_post_media upm LEFT JOIN user_posts up ON up.id = upm.post_id WHERE up.id IS NULL;
DELETE upl FROM user_post_likes upl LEFT JOIN user_posts up ON up.id = upl.post_id LEFT JOIN users u ON u.id = upl.user_id WHERE up.id IS NULL OR u.id IS NULL;
DELETE upcl FROM user_post_comment_likes upcl LEFT JOIN user_post_comments upc ON upc.id = upcl.comment_id LEFT JOIN users u ON u.id = upcl.user_id WHERE upc.id IS NULL OR u.id IS NULL;
DELETE upc FROM user_post_comments upc LEFT JOIN user_posts up ON up.id = upc.post_id LEFT JOIN users u ON u.id = upc.user_id WHERE up.id IS NULL OR u.id IS NULL;
DELETE ups FROM user_post_shares ups LEFT JOIN user_posts up ON up.id = ups.post_id LEFT JOIN users u ON u.id = ups.user_id WHERE up.id IS NULL OR u.id IS NULL;
DELETE udcm FROM user_direct_conversation_messages udcm LEFT JOIN user_direct_conversations udc ON udc.id = udcm.conversation_id LEFT JOIN users s ON s.id = udcm.sender_id LEFT JOIN users r ON r.id = udcm.receiver_id WHERE udc.id IS NULL OR s.id IS NULL OR r.id IS NULL;
DELETE udc FROM user_direct_conversations udc LEFT JOIN users u1 ON u1.id = udc.user1_id LEFT JOIN users u2 ON u2.id = udc.user2_id WHERE u1.id IS NULL OR u2.id IS NULL;
DELETE sc FROM saved_companies sc LEFT JOIN users u ON u.id = sc.user_id LEFT JOIN recruiters r ON r.id = sc.company_id WHERE u.id IS NULL OR r.id IS NULL;
DELETE fc FROM favourite_companies fc LEFT JOIN users u ON u.id = fc.user_id LEFT JOIN recruiters r ON r.id = fc.company_id WHERE u.id IS NULL OR r.id IS NULL;

DROP TRIGGER IF EXISTS before_users_delete_cleanup_reset_tokens;
CREATE TRIGGER before_users_delete_cleanup_reset_tokens BEFORE DELETE ON users FOR EACH ROW DELETE FROM reset_tokens WHERE user_id = OLD.id AND user_type = 'USER';

DROP TRIGGER IF EXISTS before_users_delete_cleanup_company_comment_likes;
CREATE TRIGGER before_users_delete_cleanup_company_comment_likes BEFORE DELETE ON users FOR EACH ROW DELETE FROM post_comment_likes WHERE user_id = OLD.id AND author_role = 'USER';

DROP TRIGGER IF EXISTS before_users_delete_cleanup_company_comments;
CREATE TRIGGER before_users_delete_cleanup_company_comments BEFORE DELETE ON users FOR EACH ROW DELETE FROM post_comments WHERE user_id = OLD.id AND author_role = 'USER';

DROP TRIGGER IF EXISTS before_users_delete_cleanup_user_reviews;
CREATE TRIGGER before_users_delete_cleanup_user_reviews BEFORE DELETE ON users FOR EACH ROW DELETE FROM user_reviews WHERE user_id = OLD.id;

DROP TRIGGER IF EXISTS before_users_delete_cleanup_company_post_views;
CREATE TRIGGER before_users_delete_cleanup_company_post_views BEFORE DELETE ON users FOR EACH ROW DELETE FROM company_post_views WHERE user_id = OLD.id;

DROP TRIGGER IF EXISTS before_users_delete_cleanup_company_post_likes;
CREATE TRIGGER before_users_delete_cleanup_company_post_likes BEFORE DELETE ON users FOR EACH ROW DELETE FROM post_likes WHERE user_id = OLD.id;

DROP TRIGGER IF EXISTS before_users_delete_cleanup_company_followers;
CREATE TRIGGER before_users_delete_cleanup_company_followers BEFORE DELETE ON users FOR EACH ROW DELETE FROM company_followers WHERE user_id = OLD.id;

DROP TRIGGER IF EXISTS before_users_delete_cleanup_company_network;
CREATE TRIGGER before_users_delete_cleanup_company_network BEFORE DELETE ON users FOR EACH ROW DELETE FROM company_network WHERE user_id = OLD.id;

DROP TRIGGER IF EXISTS before_users_delete_cleanup_company_status_views;
CREATE TRIGGER before_users_delete_cleanup_company_status_views BEFORE DELETE ON users FOR EACH ROW DELETE FROM company_status_views WHERE user_id = OLD.id;

DROP TRIGGER IF EXISTS before_users_delete_cleanup_saved_companies;
CREATE TRIGGER before_users_delete_cleanup_saved_companies BEFORE DELETE ON users FOR EACH ROW DELETE FROM saved_companies WHERE user_id = OLD.id;

DROP TRIGGER IF EXISTS before_users_delete_cleanup_favourite_companies;
CREATE TRIGGER before_users_delete_cleanup_favourite_companies BEFORE DELETE ON users FOR EACH ROW DELETE FROM favourite_companies WHERE user_id = OLD.id;

DROP TRIGGER IF EXISTS before_users_delete_cleanup_pulse_updates;
CREATE TRIGGER before_users_delete_cleanup_pulse_updates BEFORE DELETE ON users FOR EACH ROW DELETE FROM pulse_updates WHERE user_id = OLD.id;

DROP TRIGGER IF EXISTS before_users_delete_cleanup_weekly_job_alert_logs;
CREATE TRIGGER before_users_delete_cleanup_weekly_job_alert_logs BEFORE DELETE ON users FOR EACH ROW DELETE FROM weekly_job_alert_logs WHERE user_id = OLD.id;

DROP TRIGGER IF EXISTS bd_user_upcl_by_user;
CREATE TRIGGER bd_user_upcl_by_user BEFORE DELETE ON users FOR EACH ROW DELETE FROM user_post_comment_likes WHERE user_id = OLD.id;

DROP TRIGGER IF EXISTS bd_user_upcl_by_post;
CREATE TRIGGER bd_user_upcl_by_post BEFORE DELETE ON users FOR EACH ROW DELETE FROM user_post_comment_likes WHERE comment_id IN (SELECT id FROM user_post_comments WHERE user_id = OLD.id OR post_id IN (SELECT id FROM user_posts WHERE user_id = OLD.id));

DROP TRIGGER IF EXISTS before_users_delete_cleanup_user_post_comments;
CREATE TRIGGER before_users_delete_cleanup_user_post_comments BEFORE DELETE ON users FOR EACH ROW DELETE FROM user_post_comments WHERE user_id = OLD.id OR post_id IN (SELECT id FROM user_posts WHERE user_id = OLD.id);

DROP TRIGGER IF EXISTS before_users_delete_cleanup_user_post_likes;
CREATE TRIGGER before_users_delete_cleanup_user_post_likes BEFORE DELETE ON users FOR EACH ROW DELETE FROM user_post_likes WHERE user_id = OLD.id OR post_id IN (SELECT id FROM user_posts WHERE user_id = OLD.id);

DROP TRIGGER IF EXISTS before_users_delete_cleanup_user_post_shares;
CREATE TRIGGER before_users_delete_cleanup_user_post_shares BEFORE DELETE ON users FOR EACH ROW DELETE FROM user_post_shares WHERE user_id = OLD.id OR post_id IN (SELECT id FROM user_posts WHERE user_id = OLD.id);

DROP TRIGGER IF EXISTS before_users_delete_cleanup_user_post_media;
CREATE TRIGGER before_users_delete_cleanup_user_post_media BEFORE DELETE ON users FOR EACH ROW DELETE FROM user_post_media WHERE post_id IN (SELECT id FROM user_posts WHERE user_id = OLD.id);

DROP TRIGGER IF EXISTS before_users_delete_cleanup_user_posts;
CREATE TRIGGER before_users_delete_cleanup_user_posts BEFORE DELETE ON users FOR EACH ROW DELETE FROM user_posts WHERE user_id = OLD.id;

DROP TRIGGER IF EXISTS bd_user_direct_messages;
CREATE TRIGGER bd_user_direct_messages BEFORE DELETE ON users FOR EACH ROW DELETE FROM user_direct_conversation_messages WHERE sender_id = OLD.id OR receiver_id = OLD.id OR conversation_id IN (SELECT id FROM user_direct_conversations WHERE user1_id = OLD.id OR user2_id = OLD.id);

DROP TRIGGER IF EXISTS bd_user_direct_conversations;
CREATE TRIGGER bd_user_direct_conversations BEFORE DELETE ON users FOR EACH ROW DELETE FROM user_direct_conversations WHERE user1_id = OLD.id OR user2_id = OLD.id;

DROP TRIGGER IF EXISTS before_recruiters_delete_cleanup_reset_tokens;
CREATE TRIGGER before_recruiters_delete_cleanup_reset_tokens BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM reset_tokens WHERE user_id = OLD.id AND user_type = 'RECRUITER';

DROP TRIGGER IF EXISTS before_recruiters_delete_cleanup_company_comment_likes;
CREATE TRIGGER before_recruiters_delete_cleanup_company_comment_likes BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM post_comment_likes WHERE user_id = OLD.id AND author_role = 'RECRUITER';

DROP TRIGGER IF EXISTS before_recruiters_delete_cleanup_company_comments;
CREATE TRIGGER before_recruiters_delete_cleanup_company_comments BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM post_comments WHERE user_id = OLD.id AND author_role = 'RECRUITER';

DROP TRIGGER IF EXISTS before_recruiters_delete_cleanup_company_status_views;
CREATE TRIGGER before_recruiters_delete_cleanup_company_status_views BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM company_status_views WHERE status_id IN (SELECT id FROM company_statuses WHERE recruiter_id = OLD.id OR company_id = OLD.id);

DROP TRIGGER IF EXISTS before_recruiters_delete_cleanup_company_statuses;
CREATE TRIGGER before_recruiters_delete_cleanup_company_statuses BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM company_statuses WHERE recruiter_id = OLD.id OR company_id = OLD.id;

DROP TRIGGER IF EXISTS before_recruiters_delete_cleanup_company_post_views;
CREATE TRIGGER before_recruiters_delete_cleanup_company_post_views BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM company_post_views WHERE post_id IN (SELECT id FROM company_posts WHERE recruiter_id = OLD.id OR company_id = OLD.id);

DROP TRIGGER IF EXISTS before_recruiters_delete_cleanup_company_post_likes;
CREATE TRIGGER before_recruiters_delete_cleanup_company_post_likes BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM post_likes WHERE post_id IN (SELECT id FROM company_posts WHERE recruiter_id = OLD.id OR company_id = OLD.id);

DROP TRIGGER IF EXISTS bd_recruiter_post_comment_likes;
CREATE TRIGGER bd_recruiter_post_comment_likes BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM post_comment_likes WHERE comment_id IN (SELECT id FROM post_comments WHERE post_id IN (SELECT id FROM company_posts WHERE recruiter_id = OLD.id OR company_id = OLD.id));

DROP TRIGGER IF EXISTS bd_recruiter_post_comments;
CREATE TRIGGER bd_recruiter_post_comments BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM post_comments WHERE post_id IN (SELECT id FROM company_posts WHERE recruiter_id = OLD.id OR company_id = OLD.id);

DROP TRIGGER IF EXISTS before_recruiters_delete_cleanup_company_post_media;
CREATE TRIGGER before_recruiters_delete_cleanup_company_post_media BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM company_post_media WHERE post_id IN (SELECT id FROM company_posts WHERE recruiter_id = OLD.id OR company_id = OLD.id);

DROP TRIGGER IF EXISTS before_recruiters_delete_cleanup_company_posts;
CREATE TRIGGER before_recruiters_delete_cleanup_company_posts BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM company_posts WHERE recruiter_id = OLD.id OR company_id = OLD.id;

DROP TRIGGER IF EXISTS before_recruiters_delete_cleanup_company_followers;
CREATE TRIGGER before_recruiters_delete_cleanup_company_followers BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM company_followers WHERE company_id = OLD.id;

DROP TRIGGER IF EXISTS before_recruiters_delete_cleanup_company_network;
CREATE TRIGGER before_recruiters_delete_cleanup_company_network BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM company_network WHERE company_id = OLD.id;

DROP TRIGGER IF EXISTS before_recruiters_delete_cleanup_saved_companies;
CREATE TRIGGER before_recruiters_delete_cleanup_saved_companies BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM saved_companies WHERE company_id = OLD.id;

DROP TRIGGER IF EXISTS before_recruiters_delete_cleanup_favourite_companies;
CREATE TRIGGER before_recruiters_delete_cleanup_favourite_companies BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM favourite_companies WHERE company_id = OLD.id;
