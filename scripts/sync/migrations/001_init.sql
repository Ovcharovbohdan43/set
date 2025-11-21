-- Fastify sync gateway migrations (PostgreSQL)
CREATE TABLE IF NOT EXISTS sync_device (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  device_label TEXT NOT NULL,
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sync_delta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cursor TEXT NOT NULL,
  payload JSONB NOT NULL,
  checksum TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_delta_cursor ON sync_delta(cursor);
