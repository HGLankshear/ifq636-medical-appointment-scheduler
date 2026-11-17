const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createAppointmentRequest,
  getMyAppointments,
  getAllAppointments,
  approveAppointment,
  rejectAppointment,
} = require('../controllers/appointmentController');
 
const router = express.Router();
router.post('/', protect, authorizeRoles('patient'), createAppointmentRequest);
router.get('/my', protect, authorizeRoles('patient'), getMyAppointments);
router.get('/', protect, authorizeRoles('receptionist'), getAllAppointments);
router.patch('/:id/approve', protect, authorizeRoles('receptionist'), approveAppointment);
router.patch('/:id/reject', protect, authorizeRoles('receptionist'), rejectAppointment);
 
module.exports = router;