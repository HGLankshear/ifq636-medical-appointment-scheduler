const BADGE_STYLES = {
  Pending: 'bg-amber-100 text-amber-800',
  Approved: 'bg-emerald-100 text-emerald-800',
  Rejected: 'bg-red-100 text-red-800',
  Cancelled: 'bg-slate-200 text-slate-700',
};
 
export default function StatusBadge({ status }) {
  const cls = BADGE_STYLES[status] || 'bg-slate-100 text-slate-800';
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}