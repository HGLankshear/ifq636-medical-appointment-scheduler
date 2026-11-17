const Appointment = require('../models/Appointment');
const GP = require('../models/GP');
const {
  SLOT_STEP_MINUTES,
  APPOINTMENT_DURATIONS,
  REJECTION_MESSAGES,
} = require('../config/appointmentConfig');
const {
  toMinutes,
  isGpFree,
  findAlternativeGpsAtTime,
  findNextAvailableSlot,
} = require('../utils/availability');
 
const createAppointmentRequest = async (req, res) => {
  try {
    const { date, startTime, appointmentType, gpSelection, reason } = req.body;
    if (!date || !startTime || !appointmentType || !gpSelection) {
      return res.status(400).json({ message: 'Please select date, time, type, and a GP or No preference.' });
    }
 
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    if (date < todayStr || (date === todayStr && toMinutes(startTime) <= nowMins)) {
      return res.status(400).json({ message: 'Cannot request an appointment in the past.' });
    }
 
    const durationMinutes = APPOINTMENT_DURATIONS[appointmentType];
    if (!durationMinutes) {
      return res.status(400).json({ message: 'Invalid appointment type.' });
    }
    if (toMinutes(startTime) % SLOT_STEP_MINUTES !== 0) {
      return res.status(400).json({ message: 'Start time must align to 15-minute intervals.' });
    }
 
    const allGps = await GP.find().sort({ name: 1 });
    const upcomingAppts = await Appointment.find({
      date: { $gte: date },
      status: { $in: ['Pending', 'Approved'] },
    });
 
    if (gpSelection === 'NO_PREF') {
      const freeGp = allGps.find((g) => isGpFree(g, date, startTime, durationMinutes, upcomingAppts));
      if (!freeGp) {
        const nextSlot = findNextAvailableSlot(allGps, date, startTime, durationMinutes, upcomingAppts);
        return res.status(409).json({
          code: 'NO_GP_AVAILABLE',
          message: 'No GP has availability at the requested date and time.',
          nextSlot,
        });
      }
      const created = await Appointment.create({
        patientId: req.user._id,
        gpId: null,
        tentativeGpId: freeGp._id,
        noPreference: true,
        date,
        startTime,
        durationMinutes,
        appointmentType,
        reason: reason || '',
        status: 'Pending',
      });
      return res.status(201).json(created);
    }
 
    const chosenGp = allGps.find((g) => String(g._id) === String(gpSelection));
    if (!chosenGp) {
      return res.status(400).json({ message: 'Selected GP was not found.' });
    }
 
    if (isGpFree(chosenGp, date, startTime, durationMinutes, upcomingAppts)) {
      const created = await Appointment.create({
        patientId: req.user._id,
        gpId: chosenGp._id,
        tentativeGpId: null,
        noPreference: false,
        date,
        startTime,
        durationMinutes,
        appointmentType,
        reason: reason || '',
        status: 'Pending',
      });
      return res.status(201).json(created);
    }
 
    const altGps = findAlternativeGpsAtTime(allGps, date, startTime, durationMinutes, upcomingAppts, chosenGp._id);
    if (altGps.length > 0) {
      return res.status(409).json({
        code: 'GP_UNAVAILABLE',
        message: `${chosenGp.name} is unavailable at ${startTime}. Select an available alternative GP below.`,
        altGps: altGps.map((g) => ({ _id: g._id, name: g.name, specialty: g.specialty })),
      });
    }
 
    const nextSlot = findNextAvailableSlot(allGps, date, startTime, durationMinutes, upcomingAppts);
    return res.status(409).json({
      code: 'NO_GP_AVAILABLE',
      message: 'No GP has availability at the requested date and time.',
      nextSlot,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
 
const getMyAppointments = async (req, res) => {
  try {
    const items = await Appointment.find({ patientId: req.user._id })
      .populate('gpId tentativeGpId', 'name specialty')
      .sort({ date: 1, startTime: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
const getAllAppointments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const items = await Appointment.find(filter)
      .populate('patientId', 'name email')
      .populate('gpId tentativeGpId', 'name specialty')
      .sort({ date: 1, startTime: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
const approveAppointment = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    if (appt.status !== 'Pending') {
      return res.status(400).json({ message: 'Only Pending requests can be approved.' });
    }
 
    const targetGpId = req.body.assignedGpId || appt.gpId || appt.tentativeGpId;
    if (!targetGpId) {
      return res.status(400).json({ message: 'Please assign an available GP before approving.' });
    }
 
    const gp = await GP.findById(targetGpId);
    if (!gp) {
      return res.status(404).json({ message: 'Assigned GP not found.' });
    }
 
    const dayAppts = await Appointment.find({
      date: appt.date,
      status: { $in: ['Pending', 'Approved'] },
    });
 
    if (!isGpFree(gp, appt.date, appt.startTime, appt.durationMinutes, dayAppts, appt._id)) {
      return res.status(409).json({
        message: 'Conflict detected: slot overlaps another booking or GP is unavailable. Kept Pending.',
      });
    }
 
    appt.gpId = gp._id;
    appt.tentativeGpId = null;
    appt.status = 'Approved';
    await appt.save();
    return res.json(appt);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
 
const rejectAppointment = async (req, res) => {
  try {
    const { reasonCode } = req.body;
    const msg = REJECTION_MESSAGES[reasonCode];
    if (!msg) {
      return res.status(400).json({ message: 'Please select a valid predefined rejection reason.' });
    }
 
    const appt = await Appointment.findById(req.params.id);
    if (!appt) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    if (appt.status !== 'Pending') {
      return res.status(400).json({ message: 'Only Pending requests can be rejected.' });
    }
 
    appt.status = 'Rejected';
    appt.rejectionReasonCode = reasonCode;
    appt.rejectionMessageToPatient = msg;
    appt.tentativeGpId = null;
    await appt.save();
    return res.json(appt);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
 
module.exports = {
  createAppointmentRequest,
  getMyAppointments,
  getAllAppointments,
  approveAppointment,
  rejectAppointment,
};