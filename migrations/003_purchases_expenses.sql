BEGIN;

-- =========================================
-- PURCHASES
-- =========================================

CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL,
    supplier_name VARCHAR(200) NOT NULL,
    supplier_contact VARCHAR(100),
    invoice_number VARCHAR(100),
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (total_amount >= 0),
    amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (amount_paid >= 0 AND amount_paid <= total_amount),
    payment_method VARCHAR(30),
    notes TEXT,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT purchases_business_fk
        FOREIGN KEY (business_id)
        REFERENCES businesses(id),

    CONSTRAINT purchases_business_user_fk
        FOREIGN KEY (business_id, created_by)
        REFERENCES users(business_id, id),

    CONSTRAINT purchases_business_id_unique
        UNIQUE (business_id, id)
);


-- =========================================
-- PURCHASE ITEMS
-- =========================================

CREATE TABLE purchase_items (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL,
    purchase_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(14,2) NOT NULL CHECK (unit_cost >= 0),
    total_cost NUMERIC(14,2) NOT NULL CHECK (total_cost >= 0),

    CONSTRAINT purchase_items_purchase_fk
        FOREIGN KEY (business_id, purchase_id)
        REFERENCES purchases(business_id, id)
        ON DELETE CASCADE,

    CONSTRAINT purchase_items_product_fk
        FOREIGN KEY (business_id, product_id)
        REFERENCES products(business_id, id),

    CONSTRAINT purchase_items_business_id_unique
        UNIQUE (business_id, id)
);


-- =========================================
-- EXPENSES
-- =========================================

CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT expenses_business_fk
        FOREIGN KEY (business_id)
        REFERENCES businesses(id),

    CONSTRAINT expenses_business_user_fk
        FOREIGN KEY (business_id, created_by)
        REFERENCES users(business_id, id),

    CONSTRAINT expenses_category_check
        CHECK (
            category IN (
                'transport',
                'electricity',
                'rent',
                'salaries',
                'maintenance',
                'utilities',
                'supplies',
                'marketing',
                'other'
            )
        ),

    CONSTRAINT expenses_business_id_unique
        UNIQUE (business_id, id)
);


-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX idx_purchases_business_date
    ON purchases(business_id, purchase_date DESC);

CREATE INDEX idx_purchases_business_supplier
    ON purchases(business_id, supplier_name);

CREATE INDEX idx_purchase_items_business_purchase
    ON purchase_items(business_id, purchase_id);

CREATE INDEX idx_purchase_items_business_product
    ON purchase_items(business_id, product_id);

CREATE INDEX idx_expenses_business_date
    ON expenses(business_id, expense_date DESC);

CREATE INDEX idx_expenses_business_category
    ON expenses(business_id, category);

COMMIT;
