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

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      localStorage.setItem('authToken', token);

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
    <div className="casa-admin min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Soft blurred blobs + dashed ring, same decorative language as the site's hero sections */}
      <div className="absolute -top-28 -right-24 w-[400px] h-[400px] rounded-full bg-[#93bbc0] opacity-25 blur-[4px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-[320px] h-[320px] rounded-full bg-casa-gold opacity-40 blur-[4px] pointer-events-none" />
      <div className="absolute top-[-120px] left-1/2 w-[360px] h-[360px] rounded-full border-[2.5px] border-dashed border-casa-red/20 pointer-events-none" />

      <div className="relative w-full max-w-md casa-card-bold p-8">
        <div className="flex items-center gap-2 justify-center mb-7">
          <img src="/Horizontal_1.svg" alt="Casa De ELE" className="h-8 w-auto" />
          <span className="text-[12px] font-semibold tracking-[0.14em] uppercase text-casa-ink/50">Admin</span>
        </div>

        <div className="casa-eyebrow text-center mb-2.5">Staff only</div>
        <h1 className="font-heading text-3xl font-black tracking-tight text-center mb-6">Super Admin Sign In</h1>

        {error && (
          <div className="mb-4 rounded-2xl bg-casa-red/8 border-2 border-casa-red/30 px-4 py-3 text-[14px] font-semibold text-casa-redDark text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAdminSignIn} className="space-y-4">
          <div>
            <label className="block text-[12.5px] font-bold tracking-[0.08em] uppercase text-casa-ink/60 mb-2">Super Admin Email</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              required
              className="casa-input"
              placeholder="super.admin@example.com"
            />
          </div>
          <div>
            <label className="block text-[12.5px] font-bold tracking-[0.08em] uppercase text-casa-ink/60 mb-2">Password</label>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              required
              className="casa-input"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className="casa-btn w-full !py-3 mt-2">
            {loading ? <Spinner className="text-white" /> : null}Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
