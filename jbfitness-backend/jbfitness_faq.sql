-- FAQ table for dynamic FAQ content
CREATE TABLE IF NOT EXISTS faq (
  id INT NOT NULL AUTO_INCREMENT,
  category VARCHAR(100) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
