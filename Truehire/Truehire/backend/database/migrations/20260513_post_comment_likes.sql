CREATE TABLE IF NOT EXISTS post_comment_likes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  comment_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT NOT NULL,
  author_role VARCHAR(30) NOT NULL DEFAULT 'USER',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_post_comment_likes_user_comment (comment_id, user_id, author_role),
  INDEX idx_post_comment_likes_comment_id (comment_id),
  INDEX idx_post_comment_likes_user_id (user_id)
);
