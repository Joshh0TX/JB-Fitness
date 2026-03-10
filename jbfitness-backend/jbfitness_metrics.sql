DROP TABLE IF EXISTS metrics CASCADE;

CREATE TABLE metrics (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  calories INT DEFAULT 0,
  water_intake INT DEFAULT 0,
  workouts_completed INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_metrics_user_id ON metrics(user_id);
