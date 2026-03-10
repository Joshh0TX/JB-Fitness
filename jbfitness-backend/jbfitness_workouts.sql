DROP TABLE IF EXISTS workouts CASCADE;

CREATE TABLE workouts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100),
  duration INT,
  calories_burned INT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
