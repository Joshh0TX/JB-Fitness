DROP TABLE IF EXISTS meals CASCADE;

CREATE TABLE meals (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  calories INT,
  protein INT,
  carbs INT,
  fats INT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
