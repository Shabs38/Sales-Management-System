const express = require('express');

const {
    login,
    me,
    logout
} = require('../controllers/authController');

const router = express.Router();


/* Login */
router.post('/login', login);


/* Current logged-in user */
router.get('/me', me);


/* Logout */
router.post('/logout', logout);


module.exports = router;