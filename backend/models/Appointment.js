const mongoose = require('mongoose');
 
const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: null },
    isGuestBooking: { type: Boolean, default: false },
    guestDetails: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    gpId: { type: mongoose.Schema.Types.ObjectId, ref: 'GP', default: null },
    tentativeGpId: { type: mongoose.Schema.Types.ObjectId, ref: 'GP', default: null },
    noPreference: { type: Boolean, default: false },
    date: { type: String, required: true },          // 'YYYY-MM-DD'
    startTime: { type: String, required: true },     // 'HH:MM' 15-min interval
    durationMinutes: { type: Number, enum: [15, 20], required: true },
    appointmentType: { type: String, required: true },
    reason: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
      default: 'Pending',
    },
    rejectionReasonCode: { type: String, default: null },
    rejectionMessageToPatient: { type: String, default: '' },
  },
  { timestamps: true }
);
 
appointmentSchema.index({ date: 1, status: 1 });
module.exports = mongoose.model('Appointment', appointmentSchema);