import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  // Check if our custom flag exists in local storage
  const isAuthenticated = localStorage.getItem('isAuthenticated');

  // If there is no token, forcefully redirect them to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If they have a token, render the child routes (like Home)
  return <Outlet />;
}