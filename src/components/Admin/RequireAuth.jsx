import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Spinner from '../Common/Spinner'; // We'll show a spinner during verification
import { apiGet } from '../../utils/api'; // Import apiGet


export default function RequireAuth() {
  const location = useLocation();
  const [authStatus, setAuthStatus] = useState('loading'); // 'loading', 'authorized', 'unauthorized'

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('authToken');

      // If no token, they are unauthorized.
      if (!token) {
        setAuthStatus('unauthorized');
        return;
      }

      // If there's a token, verify it with the backend.
      try {
        // Use apiGet instead of fetch
        await apiGet('/api/admins/check-status');
        setAuthStatus('authorized');
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem('authToken');
        setAuthStatus('unauthorized');
      }
    };

    verifyUser();
  }, [location.pathname]);

  // Show a loading state while we check the user's status
  if (authStatus === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="text-red-700" />
      </div>
    );
  }

  // If authorized, show the admin content.
  if (authStatus === 'authorized') {
    return <Outlet />;
  }

  // If unauthorized, redirect to the admin login page.
  return <Navigate to="/admin/login" replace />;
}