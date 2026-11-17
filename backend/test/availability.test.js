const { expect } = require('chai');
const {
  isGpFree,
  findAlternativeGpsAtTime,
  findNextAvailableSlot,
} = require('../utils/availability');
 
describe('AvailabilityEngine', () => {
  const gp1 = {
    _id: 'gp1',
    name: 'Dr Priya Patel',
    workingHours: [{ dayOfWeek: 1, start: '09:00', end: '17:00' }],
    leaveDates: ['2026-11-23'],
  };
  const gp2 = {
    _id: 'gp2',
    name: 'Dr Terra Master',
    workingHours: [{ dayOfWeek: 1, start: '09:00', end: '17:00' }],
    leaveDates: [],
  };
  const appts = [
    { _id: 'a1', gpId: 'gp1', date: '2026-11-30', startTime: '10:00', durationMinutes: 15, status: 'Approved' },
  ];
 
  it('allows adjacent 15-min slot immediately after existing booking', () => {
    expect(isGpFree(gp1, '2026-11-30', '10:15', 15, appts)).to.equal(true);
  });
 
  it('blocks overlapping 20-min consultation', () => {
    expect(isGpFree(gp1, '2026-11-30', '09:45', 20, appts)).to.equal(false);
  });
 
  it('blocks GP on scheduled leaveDates', () => {
    expect(isGpFree(gp1, '2026-11-23', '10:00', 15, [])).to.equal(false);
  });
 
  it('returns alternative free GP at the same requested time', () => {
    const alts = findAlternativeGpsAtTime([gp1, gp2], '2026-11-30', '10:00', 15, appts, 'gp1');
    expect(alts.map((g) => g._id)).to.deep.equal(['gp2']);
  });
 
  it('suggests next available 15-min slot when all GPs busy at 10:00', () => {
    const busyBoth = [
      ...appts,
      { _id: 'a2', gpId: 'gp2', date: '2026-11-30', startTime: '10:00', durationMinutes: 15, status: 'Pending' },
    ];
    const next = findNextAvailableSlot([gp1, gp2], '2026-11-30', '10:00', 15, busyBoth);
    expect(next.startTime).to.equal('10:15');
  });
 
  it('honors tentativeGpId hold while No Preference request is Pending', () => {
    const held = [
      { _id: 'a3', gpId: null, tentativeGpId: 'gp1', date: '2026-11-30', startTime: '11:00', durationMinutes: 20, status: 'Pending' },
    ];
    expect(isGpFree(gp1, '2026-11-30', '11:00', 15, held)).to.equal(false);
  });
});
