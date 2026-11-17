const { expect } = require('chai');
const { isGpFree } = require('../utils/availability');
const { APPOINTMENT_DURATIONS } = require('../config/appointmentConfig');
 
describe('Direct & Guest Booking Rules (IMAS-19)', () => {
  const gp = {
    _id: 'gp1',
    name: 'Dr Priya Patel',
    workingHours: [{ dayOfWeek: 1, start: '09:00', end: '17:00' }],
    leaveDates: [],
  };
 
  it('blocks direct booking when GP already has an Approved slot overlapping time', () => {
    const existing = [
      { _id: 'd1', gpId: 'gp1', date: '2026-11-30', startTime: '09:00', durationMinutes: 20, status: 'Approved' },
    ];
    expect(isGpFree(gp, '2026-11-30', '09:15', APPOINTMENT_DURATIONS['Vaccination'], existing)).to.equal(false);
  });
 
  it('allows adjacent direct booking immediately after a 15-min Vaccination', () => {
    const existing = [
      { _id: 'd2', gpId: 'gp1', date: '2026-11-30', startTime: '09:00', durationMinutes: 15, status: 'Approved' },
    ];
    expect(isGpFree(gp, '2026-11-30', '09:15', APPOINTMENT_DURATIONS['General consultation'], existing)).to.equal(true);
  });
});