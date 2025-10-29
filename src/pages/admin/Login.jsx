import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, signInWithEmailAndPassword, signOut } from '../../firebase';
import Spinner from '../../components/Common/Spinner';
import { apiGet } from '../../utils/api'; 

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL;

  useEffect(() => {
    if (localStorage.getItem('authToken')) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  async function verifyAdminStatus() {
    try {
      // No need to pass the token here, apiGet handles it
      await apiGet('/api/admins/check-status');
      return true;
    } catch (error) {
      console.error("Admin check failed:", error);
      return false;
    }
  }

  async function handleAdminSignIn(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL;
    if (email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
        setError('Access denied. This login is for the super administrator only.');
        setLoading(false);
        return;
    }
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      localStorage.setItem('authToken', token); // Set token *before* verifying

      const isAdmin = await verifyAdminStatus();

      if (isAdmin) {
        navigate('/admin/dashboard');
      } else {
        setError('Authentication succeeded but you do not have admin privileges.');
        await signOut(auth);
        localStorage.removeItem('authToken');
      }
    }  catch (e) {
      switch (e.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Invalid super admin email or password.');
          break;
        default:
          setError('An unexpected error occurred. Please try again.');
          console.error("Firebase Auth Error:", e);
          break;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 justify-center mb-6">
          <img src="/Horizontal_1.svg" alt="Casa De ELE" className="h-8 w-auto" />
          <span className="text-sm text-gray-500">| Admin Panel</span>
        </div>
        <h1 className="text-xl font-semibold text-center mb-4">Super Admin Sign In</h1>
        {error && <div className="mb-3 text-sm text-red-600 text-center">{error}</div>}

        <form onSubmit={handleAdminSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Super Admin Email</label>
            <input 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              type="email" 
              required 
              className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm focus:border-red-600 focus:ring-2 focus:ring-red-600/30 focus:bg-white transition-all duration-200 placeholder-gray-400"
              placeholder="super.admin@example.com" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              type="password" 
              required 
              className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm focus:border-red-600 focus:ring-2 focus:ring-red-600/30 focus:bg-white transition-all duration-200 placeholder-gray-400"
              placeholder="••••••••" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-red-700 text-white hover:bg-red-800 disabled:opacity-60 transition"
          >
            {loading ? <Spinner /> : null}Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
