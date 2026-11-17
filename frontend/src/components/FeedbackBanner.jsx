export default function FeedbackBanner({ type, message, onClose }) {
  if (!message) return null;
 
  const styles =
    type === 'success'
      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
      : 'bg-red-50 border-red-500 text-red-800';
 
  return (
    <div className={`mb-4 flex items-center justify-between border-l-4 p-3 rounded ${styles}`}>
      <span className="text-sm font-medium">{message}</span>
      <button type="button" onClick={onClose} className="ml-4 font-bold">
        x
      </button>
    </div>
  );
}