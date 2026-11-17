import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import FeedbackBanner from '../components/FeedbackBanner';
import StatusBadge from '../components/StatusBadge';
 
const APPOINTMENT_TYPES = [
  { label: 'Vaccination (15 min)', value: 'Vaccination' },
  { label: 'Blood test (15 min)', value: 'Blood test' },
  { label: 'General consultation (20 min)', value: 'General consultation' },
  { label: 'Other (20 min)', value: 'Other' },
];
 
const TIME_SLOTS = [];
for (let mins = 8 * 60; mins <= 17 * 60 + 45; mins += 15) {
  const hh = String(Math.floor(mins / 60)).padStart(2, '0');
  const mm = String(mins % 60).padStart(2, '0');
  TIME_SLOTS.push(`${hh}:${mm}`);
}
 
export default function PatientDashboard() {
  const [gps, setGps] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
 
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [appointmentType, setAppointmentType] = useState('General consultation');
  const [gpSelection, setGpSelection] = useState('');
  const [reason, setReason] = useState('');
 
  const [formError, setFormError] = useState('');
  const [altGps, setAltGps] = useState([]);
  const [nextSlot, setNextSlot] = useState(null);
  const [banner, setBanner] = useState({ type: 'success', message: '' });
 
  const [cancelTarget, setCancelTarget] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);
 
  const loadData = async () => {
    try {
      setLoading(true);
      const [gpRes, apptRes] = await Promise.all([
        axiosInstance.get('/api/gps'),
        axiosInstance.get('/api/appointments/my'),
      ]);
      setGps(gpRes.data);
      setAppointments(apptRes.data);
      setFetchError('');
    } catch (err) {
      setFetchError('Failed to load clinic schedules or your bookings.');
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    loadData();
  }, []);
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setAltGps([]);
    setNextSlot(null);
 
    if (!date || !gpSelection) {
      setFormError('Please select a date AND a GP (or explicitly select No preference).');
      return;
    }
 
    try {
      await axiosInstance.post('/api/appointments', {
        date,
        startTime,
        appointmentType,
        gpSelection,
        reason,
      });
      setReason('');
      setBanner({ type: 'success', message: 'Appointment request submitted (Pending approval).' });
      await loadData();
    } catch (err) {
      const data = err.response?.data || {};
      setFormError(data.message || 'Could not submit appointment request.');
      if (data.code === 'GP_UNAVAILABLE' && Array.isArray(data.altGps)) {
        setAltGps(data.altGps);
      }
      if (data.code === 'NO_GP_AVAILABLE' && data.nextSlot) {
        setNextSlot(data.nextSlot);
      }
    }
  };
 
  const handleConfirmCancel = async () => {
    try {
      await axiosInstance.patch(`/api/appointments/${cancelTarget._id}/cancel`);
      setCancelTarget(null);
      setBanner({ type: 'success', message: 'Appointment cancelled and slot released.' });
      await loadData();
    } catch (err) {
      setCancelTarget(null);
      setBanner({ type: 'error', message: err.response?.data?.message || 'Could not cancel booking.' });
    }
  };
 
  const formatGpDisplay = (appt) => {
    if (appt.gpId) return appt.gpId.name;
    if (appt.noPreference && appt.tentativeGpId) {
      return `No preference (Tentative hold: ${appt.tentativeGpId.name})`;
    }
    return 'No preference';
  };
 
  const activeList = appointments.filter((a) => a.status !== 'Cancelled');
  const cancelledList = appointments.filter((a) => a.status === 'Cancelled');
 
  return (
    <div className="max-w-6xl mx-auto p-6">
      <FeedbackBanner
        type={banner.type}
        message={banner.message}
        onClose={() => setBanner({ ...banner, message: '' })}
      />
 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded shadow">
          <h1 className="text-xl font-bold text-teal-800 mb-4">Request an Appointment</h1>
          {formError && (
            <div className="mb-4 rounded bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {formError}
            </div>
          )}
 
          {altGps.length > 0 && (
            <div className="mb-4 rounded bg-amber-50 border border-amber-300 p-3">
              <p className="text-sm font-semibold text-amber-900 mb-2">
                Available Alternative GPs at {startTime}:
              </p>
              <div className="flex flex-wrap gap-2">
                {altGps.map((g) => (
                  <button
                    key={g._id}
                    type="button"
                    onClick={() => {
                      setGpSelection(g._id);
                      setAltGps([]);
                      setFormError('');
                    }}
                    className="bg-teal-700 text-white text-xs px-3 py-1.5 rounded hover:bg-teal-800"
                  >
                    Select {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}
 
          {nextSlot && (
            <div className="mb-4 rounded bg-sky-50 border border-sky-300 p-3">
              <p className="text-sm font-semibold text-sky-900 mb-2">
                Next Available Slot: {nextSlot.date} at {nextSlot.startTime} ({nextSlot.gpName})
              </p>
              <button
                type="button"
                onClick={() => {
                  setDate(nextSlot.date);
                  setStartTime(nextSlot.startTime);
                  setGpSelection(nextSlot.gpId);
                  setNextSlot(null);
                  setFormError('');
                }}
                className="bg-sky-700 text-white text-xs px-3 py-1.5 rounded hover:bg-sky-800"
              >
                Use This Slot
              </button>
            </div>
          )}
 
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
 
            <div>
              <label className="block text-sm font-medium mb-1">Exact Time (15-min intervals)</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
 
            <div>
              <label className="block text-sm font-medium mb-1">Appointment Type</label>
              <select
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {APPOINTMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
 
            <div>
              <label className="block text-sm font-medium mb-1">GP Preference</label>
              <select
                value={gpSelection}
                onChange={(e) => setGpSelection(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">-- Select GP or No preference --</option>
                {gps.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name} ({g.specialty})
                  </option>
                ))}
                <option value="NO_PREF">No preference (Receptionist assigns available GP)</option>
              </select>
            </div>
 
            <div>
              <label className="block text-sm font-medium mb-1">Reason (optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="w-full p-2 border rounded"
                placeholder="Brief note for the clinic..."
              />
            </div>
 
            <button type="submit" className="w-full bg-teal-700 text-white py-2 rounded hover:bg-teal-800">
              Submit Request
            </button>
          </form>
        </div>
 
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold text-teal-800 mb-4">My Appointment Requests</h2>
          {loading && <p className="text-slate-500">Loading your appointments...</p>}
          {fetchError && <p className="text-red-600">{fetchError}</p>}
          {!loading && !fetchError && activeList.length === 0 && (
            <p className="text-slate-500">You have no active appointment requests.</p>
          )}
 
          <div className="space-y-3">
            {activeList.map((appt) => (
              <div key={appt._id} className="border rounded p-3 flex justify-between items-start">
                <div>
                  <p className="font-semibold text-slate-800">
                    {appt.date} at {appt.startTime} ({appt.durationMinutes} min)
                  </p>
                  <p className="text-sm text-slate-600">
                    {appt.appointmentType} — {formatGpDisplay(appt)}
                  </p>
                  {appt.status === 'Rejected' && appt.rejectionMessageToPatient && (
                    <p className="mt-1 text-xs text-red-700 bg-red-50 p-2 rounded">
                      Clinic note: {appt.rejectionMessageToPatient}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={appt.status} />
                  {['Pending', 'Approved'].includes(appt.status) && (
                    <button
                      type="button"
                      onClick={() => setCancelTarget(appt)}
                      className="text-xs text-red-600 underline hover:text-red-800"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
 
          {cancelledList.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <button
                type="button"
                onClick={() => setShowCancelled(!showCancelled)}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                {showCancelled ? 'Hide' : 'Show'} Cancelled Appointments ({cancelledList.length})
              </button>
              {showCancelled && (
                <div className="mt-3 space-y-2">
                  {cancelledList.map((appt) => (
                    <div key={appt._id} className="border rounded p-2 text-sm text-slate-500 flex justify-between">
                      <span>{appt.date} at {appt.startTime} — {appt.appointmentType}</span>
                      <StatusBadge status={appt.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
 
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-lg max-w-sm w-full p-6">
            <h2 className="text-lg font-bold mb-2">Cancel Appointment?</h2>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to cancel {cancelTarget.date} at {cancelTarget.startTime}?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="px-4 py-1.5 border rounded"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-1.5 bg-red-600 text-white rounded"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
