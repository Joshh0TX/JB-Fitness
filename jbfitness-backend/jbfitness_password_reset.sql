-- Password reset tokens table for forgot password flow
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY token (token),
  KEY user_id (user_id),
  KEY expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
