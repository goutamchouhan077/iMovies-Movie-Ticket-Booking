import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { X, Lock, Mail, User as UserIcon, ShieldAlert } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { login, register, quickLogin } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        showToast('Signed in successfully!', 'success');
        onClose();
      } else {
        await register(name, email, password, role);
        showToast('Account registered successfully!', 'success');
        onClose();
      }
    } catch (err: any) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (roleType: 'admin' | 'user') => {
    try {
      setLoading(true);
      await quickLogin(roleType);
      showToast(`Signed in as Demo ${roleType === 'admin' ? 'Administrator' : 'User'}`, 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Quick login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs */}
        <div>
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-4">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'login'
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'signup'
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Welcome Back to IMovies' : 'Join IMovies Platform'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login'
              ? 'Access real-time seat booking, ticket passes, and history.'
              : 'Create your account to unlock instant reservations.'}
          </p>
        </div>

        {/* 1-Click Demo Evaluation Buttons */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            Instant 1-Click Evaluation Logins
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuick('user')}
              disabled={loading}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium rounded-lg border border-slate-700/80 transition-colors"
            >
              Demo User
            </button>
            <button
              type="button"
              onClick={() => handleQuick('admin')}
              disabled={loading}
              className="py-1.5 px-3 bg-amber-400/10 hover:bg-amber-400/20 text-xs text-amber-300 font-medium rounded-lg border border-amber-400/30 transition-colors"
            >
              Demo Admin
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="text-slate-400 block mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Miller"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-slate-400 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="text-slate-400 block mb-1">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
              >
                <option value="user">Regular Customer / Moviegoer</option>
                <option value="admin">Cinema Administrator</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-400/20 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};
