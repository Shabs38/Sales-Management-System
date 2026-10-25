BEGIN;

-- 1. Allow the same SKU in different businesses.
ALTER TABLE products
    DROP CONSTRAINT IF EXISTS products_sku_key;

ALTER TABLE products
    ADD CONSTRAINT products_business_sku_unique
    UNIQUE (business_id, sku);

-- 2. Allow the same customer phone number in different businesses.
ALTER TABLE customers
    DROP CONSTRAINT IF EXISTS customers_phone_key;

ALTER TABLE customers
    ADD CONSTRAINT customers_business_phone_unique
    UNIQUE (business_id, phone);

-- 3. Allow sale references to be unique within each business.
ALTER TABLE sales
    DROP CONSTRAINT IF EXISTS sales_sale_reference_key;

ALTER TABLE sales
    ADD CONSTRAINT sales_business_reference_unique
    UNIQUE (business_id, sale_reference);

-- 4. Create composite unique keys for ownership enforcement.
ALTER TABLE users
    ADD CONSTRAINT users_business_id_id_unique
    UNIQUE (business_id, id);

ALTER TABLE products
    ADD CONSTRAINT products_business_id_id_unique
    UNIQUE (business_id, id);

ALTER TABLE customers
    ADD CONSTRAINT customers_business_id_id_unique
    UNIQUE (business_id, id);

ALTER TABLE sales
    ADD CONSTRAINT sales_business_id_id_unique
    UNIQUE (business_id, id);

-- 5. Require a sale's user and customer to belong
-- to the same business as the sale.
ALTER TABLE sales
    DROP CONSTRAINT IF EXISTS sales_user_fk;

ALTER TABLE sales
    DROP CONSTRAINT IF EXISTS sales_customer_fk;

ALTER TABLE sales
    ADD CONSTRAINT sales_business_user_fk
    FOREIGN KEY (business_id, user_id)
    REFERENCES users (business_id, id);

ALTER TABLE sales
    ADD CONSTRAINT sales_business_customer_fk
    FOREIGN KEY (business_id, customer_id)
    REFERENCES customers (business_id, id);

-- 6. Require each sale item to reference a sale and
-- product belonging to the same business.
ALTER TABLE sale_items
    DROP CONSTRAINT IF EXISTS sale_items_sale_fk;

ALTER TABLE sale_items
    DROP CONSTRAINT IF EXISTS sale_items_product_fk;

ALTER TABLE sale_items
    ADD CONSTRAINT sale_items_business_sale_fk
    FOREIGN KEY (business_id, sale_id)
    REFERENCES sales (business_id, id)
    ON DELETE CASCADE;

ALTER TABLE sale_items
    ADD CONSTRAINT sale_items_business_product_fk
    FOREIGN KEY (business_id, product_id)
    REFERENCES products (business_id, id);

COMMIT;
