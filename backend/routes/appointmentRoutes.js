const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createAppointmentRequest,
  getMyAppointments,
} = require('../controllers/appointmentController');
 
const router = express.Router();
router.post('/', protect, authorizeRoles('patient'), createAppointmentRequest);
router.get('/my', protect, authorizeRoles('patient'), getMyAppointments);
 
module.exports = router;