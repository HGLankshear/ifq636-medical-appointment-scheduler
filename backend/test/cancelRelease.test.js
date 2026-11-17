const { expect } = require('chai');
const { isGpFree } = require('../utils/availability');
 
describe('Patient cancellation releases slot', () => {
  const gp = {
    _id: 'gp1',
    name: 'Dr Priya Patel',
    workingHours: [{ dayOfWeek: 1, start: '09:00', end: '17:00' }],
    leaveDates: [],
  };
 
  it('allows another booking once appointment status becomes Cancelled', () => {
    const activeBefore = [
      { _id: 'c1', gpId: 'gp1', date: '2026-11-30', startTime: '14:00', durationMinutes: 20, status: 'Approved' },
    ];
    expect(isGpFree(gp, '2026-11-30', '14:00', 20, activeBefore)).to.equal(false);
 
    const afterCancel = [{ ...activeBefore[0], status: 'Cancelled' }];
    expect(isGpFree(gp, '2026-11-30', '14:00', 20, afterCancel)).to.equal(true);
  });
});

