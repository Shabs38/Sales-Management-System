const express = require('express');

const {
    getManagers,
    getManagerById,
    createManager,
    updateManager,
    toggleManagerStatus,
    changeManagerPassword
} = require('../controllers/managerController');

const {
    requireDirector,
    requireBusiness
} = require('../middleware/authMiddleware');

const router = express.Router();

// Director access and valid business membership required.
router.get('/', requireDirector, requireBusiness, getManagers);

router.get('/:id', requireDirector, requireBusiness, getManagerById);

router.post('/', requireDirector, requireBusiness, createManager);

router.put('/:id', requireDirector, requireBusiness, updateManager);

router.patch('/:id/status', requireDirector, requireBusiness, toggleManagerStatus);

router.patch('/:id/password', requireDirector, requireBusiness, changeManagerPassword);

module.exports = router;
