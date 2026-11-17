import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
 
export default function AccessDenied() {
  const { user } = useAuth();
  const home = user?.role === 'receptionist' ? '/receptionist' : user ? '/patient' : '/login';
 
  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-6 rounded shadow text-center">
      <h1 className="text-xl font-bold text-red-700 mb-2">Access Denied</h1>
      <p className="text-slate-600 mb-4">
        Access denied. You do not have permission to view this page.
      </p>
      <Link to={home} className="bg-teal-700 text-white px-4 py-2 rounded">
        Go Back
      </Link>
    </div>
  );
}

  //this is the nice access denied page