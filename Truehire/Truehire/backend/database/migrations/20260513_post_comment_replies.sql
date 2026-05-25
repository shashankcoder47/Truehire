SET @add_author_role = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE post_comments ADD COLUMN author_role VARCHAR(30) NOT NULL DEFAULT ''USER'' AFTER user_id',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'post_comments'
    AND COLUMN_NAME = 'author_role'
);
PREPARE stmt FROM @add_author_role;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_parent_comment_id = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE post_comments ADD COLUMN parent_comment_id BIGINT UNSIGNED NULL AFTER author_role',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'post_comments'
    AND COLUMN_NAME = 'parent_comment_id'
);
PREPARE stmt FROM @add_parent_comment_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_parent_index = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE post_comments ADD INDEX idx_post_comments_parent_created (parent_comment_id, created_at)',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'post_comments'
    AND INDEX_NAME = 'idx_post_comments_parent_created'
);
PREPARE stmt FROM @add_parent_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
