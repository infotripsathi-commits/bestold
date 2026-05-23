
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS push_new_orders      boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_return_requests boolean NOT NULL DEFAULT true;
