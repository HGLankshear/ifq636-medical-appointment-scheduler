const express = require('express');
const { loginUser, updateUserProfile, getProfile, getPatients } = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const router = express.Router();
 
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/patients', protect, authorizeRoles('receptionist'), getPatients);
 
module.exports = router;