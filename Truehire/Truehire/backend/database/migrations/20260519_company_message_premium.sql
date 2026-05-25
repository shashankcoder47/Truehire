CREATE TABLE IF NOT EXISTS user_company_message_access (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  recruiter_id BIGINT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  expires_at DATETIME NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_company_message_access (user_id, recruiter_id),
  INDEX idx_ucma_user_status (user_id, status),
  INDEX idx_ucma_recruiter_status (recruiter_id, status)
);

CREATE TABLE IF NOT EXISTS user_company_message_payments (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  recruiter_id BIGINT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  payment_method VARCHAR(50) NULL,
  transaction_id VARCHAR(255) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  razorpay_order_id VARCHAR(255) NULL,
  razorpay_payment_id VARCHAR(255) NULL,
  paid_at DATETIME NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ucmp_user_recruiter (user_id, recruiter_id),
  INDEX idx_ucmp_razorpay_order (razorpay_order_id)
);

SET @add_user1_type = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE user_direct_conversations ADD COLUMN user1_type VARCHAR(30) NOT NULL DEFAULT ''USER'' AFTER user1_id',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user_direct_conversations'
    AND COLUMN_NAME = 'user1_type'
);
PREPARE stmt FROM @add_user1_type;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_user2_type = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE user_direct_conversations ADD COLUMN user2_type VARCHAR(30) NOT NULL DEFAULT ''USER'' AFTER user2_id',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user_direct_conversations'
    AND COLUMN_NAME = 'user2_type'
);
PREPARE stmt FROM @add_user2_type;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_sender_type = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE user_direct_conversation_messages ADD COLUMN sender_type VARCHAR(30) NOT NULL DEFAULT ''USER'' AFTER sender_id',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user_direct_conversation_messages'
    AND COLUMN_NAME = 'sender_type'
);
PREPARE stmt FROM @add_sender_type;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_receiver_type = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE user_direct_conversation_messages ADD COLUMN receiver_type VARCHAR(30) NOT NULL DEFAULT ''USER'' AFTER receiver_id',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user_direct_conversation_messages'
    AND COLUMN_NAME = 'receiver_type'
);
PREPARE stmt FROM @add_receiver_type;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_old_pair_index = (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE user_direct_conversations DROP INDEX uniq_direct_conversation_pair',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user_direct_conversations'
    AND INDEX_NAME = 'uniq_direct_conversation_pair'
);
PREPARE stmt FROM @drop_old_pair_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_typed_pair_index = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE user_direct_conversations ADD UNIQUE KEY uniq_direct_conversation_typed_pair (user1_id, user1_type, user2_id, user2_type)',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user_direct_conversations'
    AND INDEX_NAME = 'uniq_direct_conversation_typed_pair'
);
PREPARE stmt FROM @add_typed_pair_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

DROP TRIGGER IF EXISTS bd_user_company_message_access;
CREATE TRIGGER bd_user_company_message_access BEFORE DELETE ON users FOR EACH ROW DELETE FROM user_company_message_access WHERE user_id = OLD.id;

DROP TRIGGER IF EXISTS bd_user_company_message_payments;
CREATE TRIGGER bd_user_company_message_payments BEFORE DELETE ON users FOR EACH ROW DELETE FROM user_company_message_payments WHERE user_id = OLD.id;

DROP TRIGGER IF EXISTS bd_recruiter_company_message_access;
CREATE TRIGGER bd_recruiter_company_message_access BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM user_company_message_access WHERE recruiter_id = OLD.id;

DROP TRIGGER IF EXISTS bd_recruiter_company_message_payments;
CREATE TRIGGER bd_recruiter_company_message_payments BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM user_company_message_payments WHERE recruiter_id = OLD.id;
