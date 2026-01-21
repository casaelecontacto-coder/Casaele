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
  const [subscriptionState, setSubscriptionState] = useState(null); // 'success', 'pending', 'error', 'already_subscribed'

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
            setSubscriptionState(null);

            if (!email) {
              setStatus('Please enter your email');
              return;
            }

            try {
              setSubmitting(true);
              const data = await apiSend('/api/subscribers/public', 'POST', { email, role });

              // Handle different subscription states
              if (data.requiresConfirmation || data.pendingConfirmation) {
                setSubscriptionState('pending');
                setStatus(data.message || 'Please check your email to confirm your subscription');
                setEmail('');
              } else if (data.alreadySubscribed) {
                setSubscriptionState('already_subscribed');
                setStatus(data.message || 'You are already subscribed');
                setEmail('');
              } else {
                setSubscriptionState('success');
                setStatus(data.message || 'Successfully subscribed');
                setEmail('');
              }

              setSubmitting(false);
            } catch(err) {
              setSubscriptionState('error');
              setStatus(err?.message || 'Subscription failed. Please try again later');
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
            disabled={submitting || subscriptionState === 'pending' || subscriptionState === 'already_subscribed'}
            className={`px-8 py-4 rounded-full font-semibold transition-transform transform shadow-md w-full sm:w-auto text-white ${
              submitting
                ? 'bg-red-400 cursor-not-allowed'
                : (subscriptionState === 'pending' || subscriptionState === 'already_subscribed')
                ? 'bg-green-600 cursor-not-allowed'
                : 'bg-[rgba(173,21,24,1)] hover:bg-red-700 hover:scale-105'
            }`}
          >
            {submitting
              ? 'Subscribing…'
              : subscriptionState === 'pending'
              ? '✓ Check Your Email'
              : subscriptionState === 'already_subscribed'
              ? '✓ Already Subscribed'
              : 'Subscribe'
            }
          </button>
        </form>

        {/* Status Messages */}
        {status && (
          <div className={`mt-4 p-4 rounded-lg ${
            subscriptionState === 'pending'
              ? 'bg-blue-50 border border-blue-200'
              : subscriptionState === 'already_subscribed'
              ? 'bg-green-50 border border-green-200'
              : subscriptionState === 'error'
              ? 'bg-red-50 border border-red-200'
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className={`flex items-start gap-3 ${
              subscriptionState === 'pending'
                ? 'text-blue-800'
                : subscriptionState === 'already_subscribed'
                ? 'text-green-800'
                : subscriptionState === 'error'
                ? 'text-red-800'
                : 'text-gray-800'
            }`}>
              {subscriptionState === 'pending' && (
                <>
                  <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-1">Confirmation Email Sent!</p>
                    <p className="text-sm">{status}</p>
                    <p className="text-xs mt-2 opacity-75">Don't forget to check your spam folder if you don't see it in your inbox.</p>
                  </div>
                </>
              )}

              {subscriptionState === 'already_subscribed' && (
                <>
                  <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{status}</p>
                  </div>
                </>
              )}

              {subscriptionState === 'error' && (
                <>
                  <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm">{status}</p>
                  </div>
                </>
              )}

              {!subscriptionState && (
                <p className="text-sm">{status}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showAuth && <AuthForm onClose={() => setShowAuth(false)} />}

    </section>
  );
};

export default Newsletter;
