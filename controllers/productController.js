const pool = require("../config/db");


// ========================================
// GET ALL PRODUCTS
// ========================================

async function getProducts(req, res) {

    try {

        const result = await pool.query(`
            SELECT
                id,
                product_name,
                sku,
                category,
                selling_price,
                stock_quantity,
                low_stock_limit,
                is_active,
                created_at,
                updated_at
            FROM products
            WHERE is_active = TRUE
            ORDER BY id DESC
        `);


        const products = result.rows.map(function (product) {

            let status;

            if (product.stock_quantity === 0) {

                status = "out-of-stock";

            } else if (
                product.stock_quantity <= product.low_stock_limit
            ) {

                status = "low-stock";

            } else {

                status = "in-stock";

            }


            return {
                ...product,
                status
            };

        });


        res.json({
            success: true,
            products
        });


    } catch (error) {

        console.error(
            "Get products error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load products."
        });

    }

}


// ========================================
// CREATE PRODUCT
// ========================================

async function createProduct(req, res) {

    try {

        const {
            product_name,
            sku,
            category,
            selling_price,
            stock_quantity,
            low_stock_limit
        } = req.body;


        if (
            !product_name ||
            !sku ||
            !category ||
            selling_price === undefined ||
            stock_quantity === undefined ||
            low_stock_limit === undefined
        ) {

            return res.status(400).json({
                success: false,
                message: "All product fields are required."
            });

        }


        if (
            Number(selling_price) < 0 ||
            Number(stock_quantity) < 0 ||
            Number(low_stock_limit) < 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Price and stock values cannot be negative."
            });

        }


        const result = await pool.query(
            `
            INSERT INTO products (
                product_name,
                sku,
                category,
                selling_price,
                stock_quantity,
                low_stock_limit
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING
                id,
                product_name,
                sku,
                category,
                selling_price,
                stock_quantity,
                low_stock_limit,
                is_active,
                created_at,
                updated_at
            `,
            [
                product_name.trim(),
                sku.trim(),
                category,
                Number(selling_price),
                Number(stock_quantity),
                Number(low_stock_limit)
            ]
        );


        const product = result.rows[0];

        let status;


        if (product.stock_quantity === 0) {

            status = "out-of-stock";

        } else if (
            product.stock_quantity <= product.low_stock_limit
        ) {

            status = "low-stock";

        } else {

            status = "in-stock";

        }


        res.status(201).json({
            success: true,
            message: "Product created successfully.",
            product: {
                ...product,
                status
            }
        });


    } catch (error) {

        console.error(
            "Create product error:",
            error
        );


        if (error.code === "23505") {

            return res.status(409).json({
                success: false,
                message: "A product with this SKU already exists."
            });

        }


        if (error.code === "23514") {

            return res.status(400).json({
                success: false,
                message: "Invalid product category."
            });

        }


        res.status(500).json({
            success: false,
            message: "Failed to create product."
        });

    }

}


// ========================================
// UPDATE PRODUCT
// ========================================

async function updateProduct(req, res) {

    try {

        const { id } = req.params;

        const {
            product_name,
            sku,
            category,
            selling_price,
            stock_quantity,
            low_stock_limit
        } = req.body;


        if (
            !product_name ||
            !sku ||
            !category ||
            selling_price === undefined ||
            stock_quantity === undefined ||
            low_stock_limit === undefined
        ) {

            return res.status(400).json({
                success: false,
                message: "All product fields are required."
            });

        }


        if (
            Number(selling_price) < 0 ||
            Number(stock_quantity) < 0 ||
            Number(low_stock_limit) < 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Price and stock values cannot be negative."
            });

        }


        const result = await pool.query(
            `
            UPDATE products
            SET
                product_name = $1,
                sku = $2,
                category = $3,
                selling_price = $4,
                stock_quantity = $5,
                low_stock_limit = $6,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING
                id,
                product_name,
                sku,
                category,
                selling_price,
                stock_quantity,
                low_stock_limit,
                is_active,
                created_at,
                updated_at
            `,
            [
                product_name.trim(),
                sku.trim(),
                category,
                Number(selling_price),
                Number(stock_quantity),
                Number(low_stock_limit),
                id
            ]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Product not found."
            });

        }


        const product = result.rows[0];

        let status;


        if (product.stock_quantity === 0) {

            status = "out-of-stock";

        } else if (
            product.stock_quantity <= product.low_stock_limit
        ) {

            status = "low-stock";

        } else {

            status = "in-stock";

        }


        res.json({
            success: true,
            message: "Product updated successfully.",
            product: {
                ...product,
                status
            }
        });


    } catch (error) {

        console.error(
            "Update product error:",
            error
        );


        if (error.code === "23505") {

            return res.status(409).json({
                success: false,
                message: "A product with this SKU already exists."
            });

        }


        if (error.code === "23514") {

            return res.status(400).json({
                success: false,
                message: "Invalid product category."
            });

        }


        res.status(500).json({
            success: false,
            message: "Failed to update product."
        });

    }

}


// ========================================
// DELETE PRODUCT
// ========================================

async function deleteProduct(req, res) {

    try {

        const { id } = req.params;


        const result = await pool.query(
            `
            UPDATE products
            SET
                is_active = FALSE,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id, product_name
            `,
            [id]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Product not found."
            });

        }


        res.json({
            success: true,
            message: "Product deleted successfully.",
            product: result.rows[0]
        });


    } catch (error) {

        console.error(
            "Delete product error:",
            error
        );


        res.status(500).json({
            success: false,
            message: "Failed to delete product."
        });

    }

}


// ========================================
// EXPORT CONTROLLERS
// ========================================

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
};