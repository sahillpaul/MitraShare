import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { GraduationCap, User, Mail, Lock, Eye, EyeOff, Calendar, ShieldCheck } from 'lucide-react';

let isGoogleLoginProcessing = false;

export default function Login() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [semester, setSemester] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await axios.post('/api/auth/login', { email, password });
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/home');
      } else {
        await axios.post('/api/auth/signup', {
          name, email, password, semester
        });
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/home');
      }
    } catch (err: any) {
      const apiErr = err.response?.data?.error;
      setError(typeof apiErr === 'string' ? apiErr : "Authentication encountered an error.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (isGoogleLoginProcessing) return;
    isGoogleLoginProcessing = true;
    try {
      const response = await axios.post('/api/auth/google', { token: credentialResponse.credential });
      localStorage.setItem('isAuthenticated', 'true');
      if (response.data.isNewUser) {
        navigate('/onboarding');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      const apiErr = err.response?.data?.error;
      setError(typeof apiErr === 'string' ? apiErr : "Google authentication failed.");
    } finally {
      isGoogleLoginProcessing = false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-white py-6 px-4 sm:px-6 lg:px-8 font-sans relative">
      <div className="max-w-[400px] w-full bg-[#121214] p-8 rounded-2xl shadow-2xl border border-neutral-800/50 z-10">

        <div className="text-center mb-6 flex flex-col items-center">
          <div className="flex justify-center items-center gap-3 mb-2">
            <div className="bg-[#1f1f22] p-2 rounded-lg">
              <GraduationCap className="w-5 h-5 text-neutral-200" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">MitraShare</h2>
          </div>
          <p className="text-sm text-neutral-400">The exclusive CSE department vault.</p>
        </div>

        {/* --- THE UI TOGGLE SWITCH --- */}
        <div className="flex bg-[#1a1a1c] p-1 rounded-full mb-6 border border-neutral-800/50">
          <button
            type="button"
            className={`flex-1 py-2 rounded-full font-medium text-sm transition-all duration-300 ${isLogin ? 'bg-[#e5e5e5] text-black shadow-sm' : 'text-neutral-400 hover:text-white'}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-full font-medium text-sm transition-all duration-300 ${!isLogin ? 'bg-[#e5e5e5] text-black shadow-sm' : 'text-neutral-400 hover:text-white'}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-400">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-neutral-500" />
                </div>
                <input
                  type="text" required
                  className="w-full bg-[#09090b] border border-neutral-800 text-white px-3 py-2.5 pl-10 rounded-xl focus:ring-1 focus:ring-neutral-400 outline-none transition-all placeholder:text-neutral-600 text-sm"
                  placeholder="Jane Doe"
                  value={name} onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-400">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-neutral-500" />
              </div>
              <input
                type="email" required
                className="w-full bg-[#09090b] border border-neutral-800 text-white px-3 py-2.5 pl-10 rounded-xl focus:ring-1 focus:ring-neutral-400 outline-none transition-all placeholder:text-neutral-600 text-sm"
                placeholder="jane@cse.edu"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-400">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-neutral-500" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'} required minLength={6}
                className={`w-full bg-[#09090b] border border-neutral-800 text-white px-3 py-2.5 pl-10 pr-10 rounded-xl focus:ring-1 focus:ring-neutral-400 outline-none transition-all placeholder:text-neutral-600 text-sm ${!showPassword ? 'tracking-widest font-mono' : ''}`}
                placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4 text-neutral-500 hover:text-neutral-300" /> : <Eye className="h-4 w-4 text-neutral-500 hover:text-neutral-300" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-400">Semester</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-neutral-500" />
                </div>
                <select
                  className="w-full bg-[#09090b] border border-neutral-800 text-white px-3 py-2.5 pl-10 rounded-xl focus:ring-1 focus:ring-neutral-400 outline-none transition-all appearance-none text-sm"
                  value={semester} onChange={(e) => setSemester(Number(e.target.value))}
                >
                  <option value={1} className="bg-neutral-900 text-white">Sem 1</option>
                  <option value={2} className="bg-neutral-900 text-white">Sem 2</option>
                  <option value={3} className="bg-neutral-900 text-white">Sem 3</option>
                  <option value={4} className="bg-neutral-900 text-white">Sem 4</option>
                  <option value={5} className="bg-neutral-900 text-white">Sem 5</option>
                  <option value={6} className="bg-neutral-900 text-white">Sem 6</option>
                  <option value={7} className="bg-neutral-900 text-white">Sem 7</option>
                  <option value={8} className="bg-neutral-900 text-white">Sem 8</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-sm font-medium text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#e5e5e5] text-black font-semibold py-2.5 rounded-xl hover:bg-white transition-colors disabled:opacity-70 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Processing...' : (
              <>
                <ShieldCheck className="w-4 h-4" />
                {isLogin ? 'Sign In' : 'Access Vault'}
              </>
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#121214] text-neutral-500">Or continue with</span>
            </div>
            {/* The faint purple glow beneath "Access Vault" and the divider line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-[1px] bg-indigo-500/30 blur-[2px]"></div>
          </div>

          <div className="mt-6 flex justify-center [&>div]:w-full relative group">
            {/* Standard Google Login */}
            <div className="w-full flex justify-center overflow-hidden">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google authentication failed.')}
                theme="filled_black"
                shape="rectangular"
                width="334"
                text="signin_with"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 text-center w-full text-xs text-neutral-500 font-medium">
        Secured academic vault · CSE Department
      </div>
    </div>
  );
}