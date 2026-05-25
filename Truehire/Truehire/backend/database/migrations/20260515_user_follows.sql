CREATE TABLE IF NOT EXISTS user_follows (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  follower_id BIGINT NOT NULL,
  following_id BIGINT NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_follows_pair (follower_id, following_id),
  KEY idx_user_follows_follower (follower_id),
  KEY idx_user_follows_following (following_id),
  CONSTRAINT fk_user_follows_follower FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_follows_following FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);
