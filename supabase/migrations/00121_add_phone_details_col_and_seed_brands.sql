
ALTER TABLE products ADD COLUMN phone_details jsonb DEFAULT NULL;

INSERT INTO phone_brands (name, display_order, is_active) VALUES
  ('Redmi',   110, true),
  ('POCO',    120, true),
  ('iQOO',    130, true),
  ('Nothing', 140, true),
  ('Lava',    150, true),
  ('Infinix', 160, true),
  ('Tecno',   170, true),
  ('itel',    180, true),
  ('Sony',    190, true),
  ('LG',      200, true),
  ('Huawei',  210, true),
  ('Honor',   220, true),
  ('Lenovo',  230, true),
  ('Asus',    240, true),
  ('Mi',      250, true);
