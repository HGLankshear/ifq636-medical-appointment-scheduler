const mongoose = require('mongoose');
 
const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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