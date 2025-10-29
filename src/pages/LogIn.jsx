import React, { useState } from "react";
import { FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "../firebase";
import { db } from "../firebase";
import { doc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";

function AuthForm({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function ensureUserDoc(user, extra = {}) {
    const ref = doc(db, "Users", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        name: user.displayName || name || "",
        email: user.email || email,
        role: "user",
        createdAt: serverTimestamp(),
        ...extra,
      });
    }
  }

  async function handleGoogle() {
    try {
      setError(""); setLoading(true);
      const res = await signInWithPopup(auth, googleProvider);
      await ensureUserDoc(res.user, { provider: "google" });
      const token = await res.user.getIdToken();
      localStorage.setItem('authToken', token);
      onClose?.(); // Close the modal on successful login
    } catch (e) {
      setError(e?.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmail(e) {
    e.preventDefault();
    try {
      setError(""); setLoading(true);
      if (isLogin) {
        const res = await signInWithEmailAndPassword(auth, email, password);
        await ensureUserDoc(res.user, { provider: "password" });
        const token = await res.user.getIdToken();
        localStorage.setItem('authToken', token);
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(res.user, { displayName: name });
        await ensureUserDoc(res.user, { provider: "password" });
        const token = await res.user.getIdToken();
        localStorage.setItem('authToken', token);
      }
      onClose?.(); // Close the modal on successful login/signup
    } catch (e) {
      setError(e?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 sm:px-6"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-lg w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <FaTimes size={20} />
        </button>

        <h2 className="text-center font-bold text-xl sm:text-2xl md:text-3xl mb-6">
          {isLogin ? "Login" : "Signup"}
        </h2>

        <button onClick={handleGoogle} disabled={loading} className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-md py-2 hover:bg-gray-100 transition mb-6 text-sm sm:text-base disabled:opacity-60">
          <img src="/LogIn/Google__G__logo 1.svg" alt="Google Logo" />
          <span>{isLogin ? "Login" : "Signup"} with Google</span>
        </button>

        <div className="flex items-center gap-2 my-6 text-sm sm:text-base">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="text-gray-500">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {!isLogin && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e)=>setName(e.target.value)}
              className="w-full border-b border-gray-400 focus:outline-none focus:border-red-500 py-2 placeholder-black placeholder:font-normal text-sm sm:text-base"
            />
          </div>
        )}

        <div className="mb-4">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="w-full border-b border-gray-400 focus:outline-none focus:border-red-500 py-2 placeholder-black text-sm sm:text-base"
          />
        </div>

        <div className="mb-6 relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder={isLogin ? "Password" : "Create Password"}
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="w-full border-b border-gray-400 focus:outline-none focus:border-red-500 py-2 placeholder-black text-sm sm:text-base"
          />
          <div
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </div>
        </div>

        {error && <div className="text-sm text-red-600 mb-2">{String(error)}</div>}
        <button onClick={handleEmail} disabled={loading} className="w-full bg-red-700 text-white py-2 rounded-md font-semibold hover:bg-red-800 transition text-sm sm:text-base mb-4 disabled:opacity-60">
          {loading ? 'Please wait…' : (isLogin ? "Login" : "Signup")}
        </button>

        <p className="text-center text-sm sm:text-base text-gray-600">
          {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
          <span
            className="text-red-700 font-medium cursor-pointer"
            onClick={() => {
              setIsLogin(!isLogin);
              setShowPassword(false);
            }}
          >
            {isLogin ? "Signup" : "Login"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default AuthForm;