BEGIN;

-- 1. Create the businesses table.
CREATE TABLE IF NOT EXISTS businesses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    logo_url TEXT,
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add business ownership to existing tables.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS business_id INTEGER
    REFERENCES businesses(id);

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS business_id INTEGER
    REFERENCES businesses(id);

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS business_id INTEGER
    REFERENCES businesses(id);

ALTER TABLE sales
    ADD COLUMN IF NOT EXISTS business_id INTEGER
    REFERENCES businesses(id);

ALTER TABLE sale_items
    ADD COLUMN IF NOT EXISTS business_id INTEGER
    REFERENCES businesses(id);

-- 3. Distinguish platform administrators.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_platform_admin
    BOOLEAN NOT NULL DEFAULT FALSE;

-- 4. Ensure an initial business exists.
INSERT INTO businesses (name)
SELECT 'Existing Business'
WHERE NOT EXISTS (
    SELECT 1 FROM businesses
);

-- 5. Assign existing records to the initial business.
UPDATE users
SET business_id = (
    SELECT id FROM businesses ORDER BY id LIMIT 1
)
WHERE business_id IS NULL
  AND is_platform_admin = FALSE;

UPDATE products
SET business_id = (
    SELECT id FROM businesses ORDER BY id LIMIT 1
)
WHERE business_id IS NULL;

UPDATE customers
SET business_id = (
    SELECT id FROM businesses ORDER BY id LIMIT 1
)
WHERE business_id IS NULL;

UPDATE sales
SET business_id = (
    SELECT id FROM businesses ORDER BY id LIMIT 1
)
WHERE business_id IS NULL;

-- 6. Assign sale items to their sale's business.
UPDATE sale_items AS si
SET business_id = s.business_id
FROM sales AS s
WHERE si.sale_id = s.id
  AND si.business_id IS NULL;

-- 7. Require business ownership for business records.
ALTER TABLE products
    ALTER COLUMN business_id SET NOT NULL;

ALTER TABLE customers
    ALTER COLUMN business_id SET NOT NULL;

ALTER TABLE sales
    ALTER COLUMN business_id SET NOT NULL;

ALTER TABLE sale_items
    ALTER COLUMN business_id SET NOT NULL;

-- 8. Enforce the correct user/business relationship.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_business_scope_check'
          AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT users_business_scope_check
        CHECK (
            (is_platform_admin = TRUE AND business_id IS NULL)
            OR
            (is_platform_admin = FALSE AND business_id IS NOT NULL)
        );
    END IF;
END;
$$;

-- 9. Add indexes for business-scoped queries.
CREATE INDEX IF NOT EXISTS idx_users_business_id
    ON users(business_id);

CREATE INDEX IF NOT EXISTS idx_products_business_id
    ON products(business_id);

CREATE INDEX IF NOT EXISTS idx_customers_business_id
    ON customers(business_id);

CREATE INDEX IF NOT EXISTS idx_sales_business_id
    ON sales(business_id);

CREATE INDEX IF NOT EXISTS idx_sale_items_business_id
    ON sale_items(business_id);

COMMIT;
