
ALTER TABLE stores
  ADD COLUMN store_pickup_enabled boolean NOT NULL DEFAULT true;

CREATE INDEX idx_stores_store_pickup_enabled ON stores(store_pickup_enabled);
