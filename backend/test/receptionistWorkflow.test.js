const { expect } = require('chai');
const { isGpFree } = require('../utils/availability');
const { REJECTION_MESSAGES } = require('../config/appointmentConfig');
 
describe('Receptionist approval & rejection guards', () => {
  const gp = {
    _id: 'gp1',
    name: 'Dr Priya Patel',
    workingHours: [{ dayOfWeek: 1, start: '09:00', end: '17:00' }],
    leaveDates: [],
  };
 
  it('excludes the current appointment id during re-approval check', () => {
    const dayAppts = [
      { _id: 'req1', gpId: 'gp1', date: '2026-11-30', startTime: '10:00', durationMinutes: 15, status: 'Pending' },
    ];
    expect(isGpFree(gp, '2026-11-30', '10:00', 15, dayAppts, 'req1')).to.equal(true);
  });
 
  it('detects the 409 conflict when another approved appointment overlaps same GP slot', () => {
    const dayAppts = [
      { _id: 'req1', gpId: 'gp1', date: '2026-11-30', startTime: '10:00', durationMinutes: 15, status: 'Pending' },
      { _id: 'req2', gpId: 'gp1', date: '2026-11-30', startTime: '10:00', durationMinutes: 20, status: 'Approved' },
    ];
    expect(isGpFree(gp, '2026-11-30', '10:00', 15, dayAppts, 'req1')).to.equal(false);
  });
 
  it('defines all four predefined rejection messages', () => {
    expect(Object.keys(REJECTION_MESSAGES)).to.have.members([
      'NO_SUITABLE_TIME',
      'GP_UNAVAILABLE',
      'CLINIC_CLOSED',
      'OTHER_OPERATIONAL',
    ]);
  });
});