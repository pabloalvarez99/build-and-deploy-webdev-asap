-- Firebase UID es string base62 (28 chars), no UUID. Alter last_user_id a VARCHAR.
ALTER TABLE unknown_barcode_scans ALTER COLUMN last_user_id TYPE VARCHAR(64);
