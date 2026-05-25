SET @reply_column_missing := (
  SELECT COUNT(*) = 0
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user_direct_conversation_messages'
    AND COLUMN_NAME = 'reply_to_message_id'
);

SET @reply_column_sql := IF(
  @reply_column_missing,
  'ALTER TABLE user_direct_conversation_messages ADD COLUMN reply_to_message_id BIGINT NULL DEFAULT NULL AFTER message',
  'SELECT 1'
);

PREPARE reply_column_stmt FROM @reply_column_sql;
EXECUTE reply_column_stmt;
DEALLOCATE PREPARE reply_column_stmt;

SET @reply_index_missing := (
  SELECT COUNT(*) = 0
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user_direct_conversation_messages'
    AND INDEX_NAME = 'idx_direct_message_reply_to'
);

SET @reply_index_sql := IF(
  @reply_index_missing,
  'ALTER TABLE user_direct_conversation_messages ADD KEY idx_direct_message_reply_to (reply_to_message_id)',
  'SELECT 1'
);

PREPARE reply_index_stmt FROM @reply_index_sql;
EXECUTE reply_index_stmt;
DEALLOCATE PREPARE reply_index_stmt;
