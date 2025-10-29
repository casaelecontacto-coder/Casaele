import React, { useState } from "react";
import AuthForm from "../../pages/LogIn";
import { apiSend } from "../../utils/api";

const Newsletter = () => {
  const roles = ["Teacher", "Student", "Explorer"];

  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Teacher');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <section id="newsletter" className="py-20 px-8 bg-[#FDF2F2] text-center">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-4xl font-bold text-gray-800 mb-4">
          Stay Updated with Ele’s Newsletters
        </h2>
        <p className="text-gray-500 mb-10 max-w-md mx-auto">
          Get weekly Spanish tips, new content updates, and exclusive resources
          delivered to your inbox!
        </p>

        {/* Role Selection without state */}
        <div className="flex justify-center items-center gap-4 mb-8">
          {roles.map((r, i) => (
            <React.Fragment key={r}>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value={r}
                  defaultChecked={i === 0} // by default Teacher selected
                  className="hidden peer"
                  onChange={() => setRole(r)}
                />
                <span className="text-lg text-gray-500 peer-checked:font-bold peer-checked:text-gray-800 hover:text-gray-800 transition-colors duration-300">
                  {r}
                </span>
              </label>
              {i < roles.length - 1 && (
                <span className="text-gray-300 text-2xl">|</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Subscription Form */}
        <form
          className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto"
          onSubmit={async (e) => {
            e.preventDefault();
            setStatus('');
            if (!email) { setStatus('Please enter your email'); return; }
            try {
              setSubmitting(true);
              const data = await apiSend('/api/subscribers/public', 'POST', { email, role });
              // brief visual confirmation delay
              setTimeout(()=>{
                setStatus('Subscribed');
                setEmail('');
                setSubmitting(false);
              }, 800);
            } catch(err) {
              setStatus(err?.message || 'Subscription failed');
              setSubmitting(false);
            }
          }}
        >
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="flex-1 w-full px-6 py-4 bg-[#FDF2F2] text-gray-700 placeholder-gray-400 focus:outline-none rounded-full border border-gray-200 shadow-sm focus:ring-2 focus:ring-red-400"
            aria-label="Email for newsletter"
          />
          <button
            type="submit"
            disabled={submitting}
            className={`px-8 py-4 rounded-full font-semibold transition-transform transform shadow-md w-full sm:w-auto text-white ${submitting ? 'bg-red-400 cursor-not-allowed' : 'bg-[rgba(173,21,24,1)] hover:bg-red-700 hover:scale-105'}`}
          >
            {submitting ? 'Subscribing…' : (status === 'Subscribed' ? 'Subscribed' : 'Subscribe')}
          </button>
        </form>
        {status && status !== 'Subscribed' && (
          <div className="mt-3 text-sm text-gray-700">{status}</div>
        )}
      </div>

      {/* Modal */}
      {showAuth && <AuthForm onClose={() => setShowAuth(false)} />}

    </section>
  );
};

export default Newsletter;
