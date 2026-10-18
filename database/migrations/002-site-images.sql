CREATE TABLE IF NOT EXISTS site_images (
  slot text PRIMARY KEY,
  version integer NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}',
  image_base64 text,
  width integer NOT NULL DEFAULT 0,
  height integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
