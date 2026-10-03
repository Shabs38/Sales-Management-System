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
    requireDirector
} = require('../middleware/authMiddleware');

const router = express.Router();


// Director only
router.get('/', requireDirector, getManagers);

router.get('/:id', requireDirector, getManagerById);

router.post('/', requireDirector, createManager);

router.put('/:id', requireDirector, updateManager);

router.patch('/:id/status', requireDirector, toggleManagerStatus);

router.patch('/:id/password', requireDirector, changeManagerPassword);


module.exports = router;