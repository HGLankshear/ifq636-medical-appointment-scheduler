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
 
export default function ReceptionistDashboard() {
  const [statusTab, setStatusTab] = useState('Pending');
  const [appointments, setAppointments] = useState([]);
  const [gps, setGps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState({ type: 'success', message: '' });
 
  const [approveTarget, setApproveTarget] = useState(null);
  const [assignedGpId, setAssignedGpId] = useState('');
  const [approveError, setApproveError] = useState('');
 
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reasonCode, setReasonCode] = useState('NO_SUITABLE_TIME');
 
  const loadQueue = async (tab = statusTab) => {
    try {
      setLoading(true);
      const [queueRes, gpRes] = await Promise.all([
        axiosInstance.get(`/api/appointments?status=${tab}`),
        axiosInstance.get('/api/gps'),
      ]);
      setAppointments(queueRes.data);
      setGps(gpRes.data);
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
 
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold text-teal-800">Receptionist Appointment Queue</h1>
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
                  <td className="p-3 font-medium">{appt.patientId?.name || 'Patient'}</td>
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
    </div>
  );
}