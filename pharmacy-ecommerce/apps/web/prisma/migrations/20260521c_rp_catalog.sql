-- RP catalog: separate from `products` (farmacia stock).
-- Source: BACKUP_PRODUCTOS.txt (dbecosur snapshot, ~34k SKUs)
-- Purpose: master catalog para búsqueda/referencia, enriquecido con scraping + heurística.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS rp_catalog (
  ecosur_id           VARCHAR(20)   PRIMARY KEY,
  description         VARCHAR(500)  NOT NULL,
  suggested_price     INTEGER,                       -- CLP, null si "-"
  status              VARCHAR(10)   NOT NULL DEFAULT 'ACTV',
  barcodes            TEXT[]        NOT NULL DEFAULT '{}',
  -- enriched fields
  image_url           VARCHAR(800),
  laboratory          VARCHAR(255),
  active_ingredient   VARCHAR(500),
  therapeutic_action  VARCHAR(255),
  product_type        VARCHAR(100),                  -- medicamento/cosmético/perfume/cuidado/dental/etc
  presentation        VARCHAR(255),                  -- 100ML, 30 COMP, etc
  dose                VARCHAR(100),                  -- 500MG, 1%, etc
  form                VARCHAR(50),                   -- comprimido/jarabe/crema/spray/etc
  prescription_type   VARCHAR(50)   DEFAULT 'direct',
  info_json           JSONB,                         -- extras (descripción larga, indicaciones, fuentes)
  enrich_status       VARCHAR(20)   DEFAULT 'pending', -- pending|heuristic|scraped|failed
  enrich_attempts     INTEGER       DEFAULT 0,
  last_enriched_at    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rp_catalog_status_idx       ON rp_catalog(status);
CREATE INDEX IF NOT EXISTS rp_catalog_laboratory_idx   ON rp_catalog(laboratory);
CREATE INDEX IF NOT EXISTS rp_catalog_product_type_idx ON rp_catalog(product_type);
CREATE INDEX IF NOT EXISTS rp_catalog_enrich_idx       ON rp_catalog(enrich_status);
CREATE INDEX IF NOT EXISTS rp_catalog_barcodes_gin     ON rp_catalog USING GIN (barcodes);
CREATE INDEX IF NOT EXISTS rp_catalog_desc_trgm        ON rp_catalog USING GIN (description gin_trgm_ops);
