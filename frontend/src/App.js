import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Profile from './pages/Profile';
import { useAuth } from './context/AuthContext';
import AccessDenied from './pages/AccessDenied';
 
function RoleRoute({ allowedRole, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== allowedRole) return <Navigate to="/access-denied" replace />;
  return children;
}
 
const PatientPlaceholder = () => <div className="p-6 text-center">Patient Dashboard (Built in Stage 4)</div>;
const ReceptionistPlaceholder = () => <div className="p-6 text-center">Receptionist Queue (Built in Stage 5)</div>;
 
function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route
          path="/patient"
          element={
            <RoleRoute allowedRole="patient">
              <PatientPlaceholder />
            </RoleRoute>
          }
        />
        <Route
          path="/receptionist"
          element={
            <RoleRoute allowedRole="receptionist">
              <ReceptionistPlaceholder />
            </RoleRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
 
export default App;