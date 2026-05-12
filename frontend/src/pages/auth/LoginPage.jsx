import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import { loginUser } from '../../store/slices/authSlice';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '', twoFactorCode: '' });
  const [showPass, setShowPass] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      if (result.payload?.requires2FA) {
        setRequires2FA(true);
        return;
      }
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(result.payload || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-center px-16 w-1/2 text-white">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary-300" />
          </div>
          <span className="text-2xl font-bold">ProManager</span>
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6">
          Manage projects<br />
          <span className="text-primary-300">at the speed</span><br />
          of thought.
        </h1>
        <p className="text-slate-400 text-lg max-w-md">
          Real-time collaboration, Kanban boards, Gantt charts, and AI-powered insights — all in one place.
        </p>
        <div className="mt-12 grid grid-cols-3 gap-6">
          {[['10k+', 'Projects'], ['50k+', 'Tasks Done'], ['99.9%', 'Uptime']].map(([num, label]) => (
            <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold text-primary-300">{num}</div>
              <div className="text-slate-400 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-2 mb-2 lg:hidden">
              <Zap className="w-6 h-6 text-primary-300" />
              <span className="text-white font-bold text-xl">ProManager</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
            <p className="text-slate-400 mb-8 text-sm">Sign in to your account</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!requires2FA ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email" name="email" value={form.email}
                        onChange={handleChange} required
                        placeholder="you@company.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPass ? 'text' : 'password'} name="password"
                        value={form.password} onChange={handleChange} required
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Two-Factor Code</label>
                  <input
                    type="text" name="twoFactorCode" value={form.twoFactorCode}
                    onChange={handleChange} required maxLength={6} placeholder="000000"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm text-center text-2xl tracking-widest"
                  />
                  <p className="mt-2 text-xs text-slate-400">Enter the 6-digit code from your authenticator app</p>
                </div>
              )}

              {error && <p className="text-red-400 text-sm bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}

              <button
                type="submit" disabled={loading}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {requires2FA ? 'Verify' : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-300 hover:text-primary-200 font-medium">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
