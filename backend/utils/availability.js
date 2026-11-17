function getDayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}
 
function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}
 
function toMinutes(hhmm) {
  const [h, min] = hhmm.split(':').map(Number);
  return h * 60 + min;
}
 
function toHHMM(totalMinutes) {
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mm = String(totalMinutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}
 
function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}
 
function isGpFree(gp, dateStr, startTime, durationMin, activeAppts, ignoreApptId = null) {
  if (!gp || (gp.leaveDates && gp.leaveDates.includes(dateStr))) {
    return false;
  }
  const dow = getDayOfWeek(dateStr);
  const window = (gp.workingHours || []).find((w) => w.dayOfWeek === dow);
  if (!window) return false;
 
  const reqStart = toMinutes(startTime);
  const reqEnd = reqStart + durationMin;
  if (reqStart < toMinutes(window.start) || reqEnd > toMinutes(window.end)) {
    return false;
  }
 
  for (const appt of activeAppts) {
    if (ignoreApptId && String(appt._id) === String(ignoreApptId)) continue;
    if (appt.date !== dateStr) continue;
    if (!['Pending', 'Approved'].includes(appt.status)) continue;
 
    const heldGp = appt.gpId || appt.tentativeGpId;
    if (heldGp && String(heldGp) === String(gp._id)) {
      const apptStart = toMinutes(appt.startTime);
      const apptEnd = apptStart + appt.durationMinutes;
      if (rangesOverlap(reqStart, reqEnd, apptStart, apptEnd)) {
        return false;
      }
    }
  }
  return true;
}
 
function findAlternativeGpsAtTime(allGps, dateStr, startTime, durationMin, activeAppts, excludeGpId = null) {
  return allGps.filter(
    (g) => String(g._id) !== String(excludeGpId) && isGpFree(g, dateStr, startTime, durationMin, activeAppts)
  );
}
 
function findNextAvailableSlot(allGps, fromDateStr, fromTime, durationMin, activeAppts) {
  for (let dayOffset = 0; dayOffset <= 14; dayOffset++) {
    const candidateDate = addDays(fromDateStr, dayOffset);
    const startMins = dayOffset === 0 ? Math.max(480, toMinutes(fromTime) + 15) : 480;
    for (let mins = startMins; mins <= 1065; mins += 15) {
      const timeStr = toHHMM(mins);
      for (const gp of allGps) {
        if (isGpFree(gp, candidateDate, timeStr, durationMin, activeAppts)) {
          return {
            date: candidateDate,
            startTime: timeStr,
            gpId: gp._id,
            gpName: gp.name,
          };
        }
      }
    }
  }
  return null;
}
 
module.exports = {
  getDayOfWeek,
  addDays,
  toMinutes,
  toHHMM,
  rangesOverlap,
  isGpFree,
  findAlternativeGpsAtTime,
  findNextAvailableSlot,
};