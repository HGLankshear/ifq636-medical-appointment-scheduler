import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import FeedbackBanner from '../components/FeedbackBanner';
import StatusBadge from '../components/StatusBadge';
 
const REJECTION_OPTIONS = [
  { code: 'NO_SUITABLE_TIME', label: 'No suitable slot available', preview: 'Please submit a new request selecting an alternate time or date.' },
  { code: 'GP_UNAVAILABLE', label: 'Requested GP unavailable', preview: 'Your requested GP is unavailable. Please submit a new request with another GP, or choose a different time.' },
  { code: 'CLINIC_CLOSED', label: 'Clinic closed', preview: 'The clinic is closed at this time. Please try scheduling for another day.' },
  { code: 'OTHER_OPERATIONAL', label: 'Other operational reason', preview: 'Due to miscellaneous circumstances, we cannot fulfill this request. Please try another date.' },
];
 
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
 
export default function ReceptionistDashboard() {
  const [statusTab, setStatusTab] = useState('Pending');
  const [appointments, setAppointments] = useState([]);
  const [gps, setGps] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState({ type: 'success', message: '' });
 
  const [approveTarget, setApproveTarget] = useState(null);
  const [assignedGpId, setAssignedGpId] = useState('');
  const [approveError, setApproveError] = useState('');
 
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reasonCode, setReasonCode] = useState('NO_SUITABLE_TIME');
 
  const [directOpen, setDirectOpen] = useState(false);
  const [bookingFor, setBookingFor] = useState('patient');
  const [directPatientId, setDirectPatientId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [directDate, setDirectDate] = useState('');
  const [directTime, setDirectTime] = useState('09:00');
  const [directType, setDirectType] = useState('General consultation');
  const [directGpId, setDirectGpId] = useState('');
  const [directReason, setDirectReason] = useState('');
  const [directError, setDirectError] = useState('');
 
  const loadQueue = async (tab = statusTab) => {
    try {
      setLoading(true);
      const [queueRes, gpRes, patRes] = await Promise.all([
        axiosInstance.get(`/api/appointments?status=${tab}`),
        axiosInstance.get('/api/gps'),
        axiosInstance.get('/api/auth/patients'),
      ]);
      setAppointments(queueRes.data);
      setGps(gpRes.data);
      setPatients(patRes.data);
    } catch (err) {
      setBanner({ type: 'error', message: 'Failed to load appointment queue.' });
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    loadQueue(statusTab);
  }, [statusTab]);
 
  const openApprove = (appt) => {
    setApproveTarget(appt);
    setAssignedGpId(appt.gpId?._id || appt.tentativeGpId?._id || '');
    setApproveError('');
  };
 
  const confirmApprove = async () => {
    try {
      await axiosInstance.patch(`/api/appointments/${approveTarget._id}/approve`, { assignedGpId });
      setApproveTarget(null);
      setBanner({ type: 'success', message: 'Appointment approved cleanly.' });
      await loadQueue(statusTab);
    } catch (err) {
      setApproveError(err.response?.data?.message || 'Could not approve appointment.');
    }
  };
 
  const confirmReject = async () => {
    try {
      await axiosInstance.patch(`/api/appointments/${rejectTarget._id}/reject`, { reasonCode });
      setRejectTarget(null);
      setBanner({ type: 'success', message: 'Appointment rejected with predefined message.' });
      await loadQueue(statusTab);
    } catch (err) {
      setBanner({ type: 'error', message: err.response?.data?.message || 'Could not reject appointment.' });
    }
  };
 
  const openDirectModal = () => {
    setBookingFor('patient');
    setDirectPatientId('');
    setGuestName('');
    setGuestPhone('');
    setGuestEmail('');
    setDirectDate('');
    setDirectTime('09:00');
    setDirectType('General consultation');
    setDirectGpId('');
    setDirectReason('');
    setDirectError('');
    setDirectOpen(true);
  };
 
  const confirmDirectBooking = async (e) => {
    e.preventDefault();
    setDirectError('');
    try {
      await axiosInstance.post('/api/appointments/direct', {
        bookingFor,
        patientId: directPatientId,
        guestDetails: { name: guestName, phone: guestPhone, email: guestEmail },
        date: directDate,
        startTime: directTime,
        appointmentType: directType,
        gpId: directGpId,
        reason: directReason,
      });
      setDirectOpen(false);
      setBanner({ type: 'success', message: 'Direct appointment created and Approved immediately.' });
      setStatusTab('Approved');
      await loadQueue('Approved');
    } catch (err) {
      setDirectError(err.response?.data?.message || 'Could not create direct booking.');
    }
  };
 
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold text-teal-800">Receptionist Appointment Queue</h1>
        <button
          type="button"
          onClick={openDirectModal}
          className="bg-teal-700 text-white px-4 py-2 rounded text-sm font-medium hover:bg-teal-800"
        >
          + Create Direct Booking
        </button>
      </div>
 
      <FeedbackBanner
        type={banner.type}
        message={banner.message}
        onClose={() => setBanner({ ...banner, message: '' })}
      />
 
      <div className="flex gap-2 mb-4">
        {['Pending', 'Approved', 'Rejected', 'Cancelled'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusTab(tab)}
            className={`px-4 py-1.5 rounded text-sm font-medium ${
              statusTab === tab ? 'bg-teal-700 text-white' : 'bg-white border text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
 
      <div className="bg-white rounded shadow overflow-x-auto">
        {loading ? (
          <p className="p-6 text-slate-500">Loading {statusTab} requests...</p>
        ) : appointments.length === 0 ? (
          <p className="p-6 text-slate-500">No {statusTab.toLowerCase()} appointments.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">Patient</th>
                <th className="p-3">Date & Exact Time</th>
                <th className="p-3">Type</th>
                <th className="p-3">GP Preference / Assigned</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt._id} className="border-t">
                  <td className="p-3 font-medium">
                    {appt.patientId?.name || (appt.isGuestBooking ? `${appt.guestDetails?.name} (Guest)` : 'Patient')}
                  </td>
                  <td className="p-3">{appt.date} at {appt.startTime} ({appt.durationMinutes}m)</td>
                  <td className="p-3">{appt.appointmentType}</td>
                  <td className="p-3">
                    {appt.gpId?.name || (appt.noPreference ? `No preference (${appt.tentativeGpId?.name || 'Unassigned'})` : 'No preference')}
                  </td>
                  <td className="p-3"><StatusBadge status={appt.status} /></td>
                  <td className="p-3 space-x-2">
                    {appt.status === 'Pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => openApprove(appt)}
                          className="bg-emerald-600 text-white px-3 py-1 rounded text-xs"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRejectTarget(appt); setReasonCode('NO_SUITABLE_TIME'); }}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
 
      {approveTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-2">Approve Request</h2>
            <p className="text-sm text-slate-600 mb-3">
              {approveTarget.date} at {approveTarget.startTime} — {approveTarget.appointmentType}
            </p>
            {approveError && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{approveError}</p>}
            <label className="block text-sm font-medium mb-1">Confirm or Assign GP</label>
            <select
              value={assignedGpId}
              onChange={(e) => setAssignedGpId(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            >
              <option value="">-- Select GP --</option>
              {gps.map((g) => (
                <option key={g._id} value={g._id}>{g.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setApproveTarget(null)} className="px-4 py-1.5 border rounded">Cancel</button>
              <button type="button" onClick={confirmApprove} className="px-4 py-1.5 bg-emerald-600 text-white rounded">Confirm Approve</button>
            </div>
          </div>
        </div>
      )}
 
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-3">Reject Request — Select Reason</h2>
            <div className="space-y-2 mb-4">
              {REJECTION_OPTIONS.map((opt) => (
                <label key={opt.code} className="block border rounded p-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="reasonCode"
                    value={opt.code}
                    checked={reasonCode === opt.code}
                    onChange={(e) => setReasonCode(e.target.value)}
                    className="mr-2"
                  />
                  <span className="font-semibold">{opt.label}</span>
                  <p className="text-xs text-slate-500 ml-5">{opt.preview}</p>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRejectTarget(null)} className="px-4 py-1.5 border rounded">Cancel</button>
              <button type="button" onClick={confirmReject} className="px-4 py-1.5 bg-red-600 text-white rounded">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
 
      {directOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded shadow-lg max-w-lg w-full p-6">
            <h2 className="text-lg font-bold text-teal-800 mb-3">Create Direct Booking (Walk-In / Phone)</h2>
            {directError && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{directError}</p>}
            <form onSubmit={confirmDirectBooking} className="space-y-3">
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="bookingFor"
                    value="patient"
                    checked={bookingFor === 'patient'}
                    onChange={() => setBookingFor('patient')}
                  />
                  Registered Patient
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="bookingFor"
                    value="guest"
                    checked={bookingFor === 'guest'}
                    onChange={() => setBookingFor('guest')}
                  />
                  Individual Guest
                </label>
              </div>
 
              {bookingFor === 'patient' ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Registered Patient</label>
                  <select
                    value={directPatientId}
                    onChange={(e) => setDirectPatientId(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">-- Select Patient --</option>
                    {patients.map((p) => (
                      <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2 border rounded p-3 bg-slate-50">
                  <input
                    type="text"
                    placeholder="Guest Full Name (required)"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Phone (optional)"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              )}
 
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={directDate}
                    onChange={(e) => setDirectDate(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Exact Time</label>
                  <select
                    value={directTime}
                    onChange={(e) => setDirectTime(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
 
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Appointment Type</label>
                  <select
                    value={directType}
                    onChange={(e) => setDirectType(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    {APPOINTMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Assigned GP</label>
                  <select
                    value={directGpId}
                    onChange={(e) => setDirectGpId(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">-- Select GP --</option>
                    {gps.map((g) => (
                      <option key={g._id} value={g._id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>
 
              <input
                type="text"
                placeholder="Reason / receptionist note (optional)"
                value={directReason}
                onChange={(e) => setDirectReason(e.target.value)}
                className="w-full p-2 border rounded"
              />
 
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setDirectOpen(false)} className="px-4 py-1.5 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-teal-700 text-white rounded">Confirm Direct Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
