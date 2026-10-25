const pool = require('../config/db');

function getBusinessId(req) {
    const id = Number(req.session?.user?.business_id);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function requireBusinessId(req, res) {
    const businessId = getBusinessId(req);

    if (businessId === null) {
        res.status(403).json({
            success: false,
            message: 'A valid business membership is required'
        });
        return null;
    }

    return businessId;
}

// Get all customers
const getCustomers = async (req, res) => {
    const businessId = requireBusinessId(req, res);
    if (businessId === null) return;

    try {
        const result = await pool.query(`
            SELECT *
            FROM customers
            WHERE business_id = $1
            ORDER BY id DESC
        `, [businessId]);

        res.status(200).json({
            success: true,
            customers: result.rows
        });

    } catch (error) {
        console.error('Error fetching customers:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch customers'
        });
    }
};


// Get one customer
const getCustomerById = async (req, res) => {
    const businessId = requireBusinessId(req, res);
    if (businessId === null) return;

    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM customers WHERE id = $1 AND business_id = $2',
            [id, businessId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.status(200).json({
            success: true,
            customer: result.rows[0]
        });

    } catch (error) {
        console.error('Error fetching customer:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer'
        });
    }
};


// Create customer
const createCustomer = async (req, res) => {
    const businessId = requireBusinessId(req, res);
    if (businessId === null) return;

    try {
        const {
            full_name,
            phone,
            email,
            address
        } = req.body;

        if (!full_name || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Full name and phone are required'
            });
        }

        const result = await pool.query(
            `INSERT INTO customers
            (business_id, full_name, phone, email, address)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [businessId, full_name, phone, email || null, address || null]
        );

        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            customer: result.rows[0]
        });

    } catch (error) {
        console.error('Error creating customer:', error);

        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'Phone number already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create customer'
        });
    }
};


// Update customer
const updateCustomer = async (req, res) => {
    const businessId = requireBusinessId(req, res);
    if (businessId === null) return;

    try {
        const { id } = req.params;

        const {
            full_name,
            phone,
            email,
            address,
            is_active
        } = req.body;

        const result = await pool.query(
            `UPDATE customers
             SET full_name = $1,
                 phone = $2,
                 email = $3,
                 address = $4,
                 is_active = $5,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $6 AND business_id = $7
             RETURNING *`,
            [
                full_name,
                phone,
                email || null,
                address || null,
                is_active !== undefined ? is_active : true,
                id,
                businessId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Customer updated successfully',
            customer: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating customer:', error);

        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'Phone number already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update customer'
        });
    }
};


// Delete customer
const deleteCustomer = async (req, res) => {
    const businessId = requireBusinessId(req, res);
    if (businessId === null) return;

    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM customers WHERE id = $1 AND business_id = $2 RETURNING *',
            [id, businessId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Customer deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting customer:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to delete customer'
        });
    }
};


module.exports = {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
};