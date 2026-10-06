import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide your email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        const user = result.user;
        if (user.role === 'ADMIN') navigate('/admin');
        else if (user.role === 'SUPPLIER') navigate('/supplier');
        else if (user.role === 'TRANSPORTER') navigate('/transporter');
        else navigate('/');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Truck className="w-6 h-6" />
          </div>
        </Link>
        <h2 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">
          Sign in to LoadX
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your registered enterprise credentials to access your portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-2xl border border-slate-200/90 shadow-sm">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Notice</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="Company Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. logistics@company.com"
              icon={Mail}
            />

            <Input
              id="password"
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={Lock}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              loading={loading}
            >
              Sign In to Workspace
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick-Fill Demo Roles */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
              Quick Test Credentials
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemo('admin@freightbid.com', 'Admin@123')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-left transition-colors"
              >
                <span className="font-semibold block">Platform Admin</span>
                <span className="text-[10px] text-slate-400">admin@freightbid.com</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('supplier1@apexlogistics.com', 'Supplier@123')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-left transition-colors"
              >
                <span className="font-semibold block">Shipper / Supplier</span>
                <span className="text-[10px] text-slate-400">supplier1@apex...</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('transporter1@delhifleet.com', 'Transporter@123')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-left transition-colors"
              >
                <span className="font-semibold block">Transporter 1</span>
                <span className="text-[10px] text-slate-400">transporter1@...</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('pending1@karnatakacargo.com', 'Pending@123')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 text-slate-700 hover:text-amber-800 text-left transition-colors"
              >
                <span className="font-semibold block">Pending User</span>
                <span className="text-[10px] text-slate-400">pending1@...</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
              Register as Supplier or Transporter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
