import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { LoginResponse, ErrorResponse } from '../../types/api';
import {
  IconShieldCheck,
  IconLock,
  IconUser,
  IconAlertCircle,
  IconEye,
  IconEyeOff,
  IconActivityHeartbeat,
  IconClockHour4,
  IconRouteSquare2,
} from '@tabler/icons-react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        username,
        password,
      });
      
      login(response.data);
    } catch (err: any) {
      const errorData = err.response?.data as ErrorResponse;
      setError(errorData?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 font-sans relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-32 w-80 h-80 rounded-full bg-primary-100/70 blur-3xl dark:bg-primary-900/20" />
        <div className="absolute -bottom-44 -right-32 w-96 h-96 rounded-full bg-primary-200/60 blur-3xl dark:bg-primary-800/20" />
      </div>

      <div className="relative min-h-screen grid grid-cols-1 lg:grid-cols-2">
        <section className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-primary-900 text-white">
          <div>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8">
              <IconShieldCheck size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Secure Clinical Platform</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight">
              Tigray Referral Management System
            </h1>
            <p className="mt-5 text-sm text-primary-200 max-w-md leading-relaxed">
              Coordinate referrals with confidence, protect patient pathways, and keep care teams aligned in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 max-w-md">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/10 border border-white/15">
              <IconActivityHeartbeat size={18} />
              <div>
                <p className="text-xs font-black uppercase tracking-wider">Real-Time Coordination</p>
                <p className="text-[11px] text-primary-200">Track referrals from submission to completion.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/10 border border-white/15">
              <IconRouteSquare2 size={18} />
              <div>
                <p className="text-xs font-black uppercase tracking-wider">Structured Workflow</p>
                <p className="text-[11px] text-primary-200">Liaison, department, and clinician handoffs unified.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/10 border border-white/15">
              <IconClockHour4 size={18} />
              <div>
                <p className="text-xs font-black uppercase tracking-wider">Operational Visibility</p>
                <p className="text-[11px] text-primary-200">Faster triage with actionable dashboard signals.</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-primary-300 uppercase tracking-wider">
            Tigray Regional Health Bureau — Official Referral Portal
          </p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="text-center mb-8 lg:hidden">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-900 text-white rounded-xl mb-4">
                <IconShieldCheck size={24} />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-primary-900 dark:text-white">TRMS</h1>
              <p className="text-sm text-primary-500 mt-1 uppercase tracking-widest">Clinical Access</p>
            </div>

            <div className="bg-white/95 dark:bg-surface-900/95 backdrop-blur-xl border border-primary-200 dark:border-primary-800 rounded-3xl shadow-2xl p-8 sm:p-10">
              <div className="mb-7">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-primary-900 text-white mb-4">
                  <IconShieldCheck size={22} />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-primary-900 dark:text-white">Welcome back</h2>
                <p className="text-sm text-primary-500 mt-1">
                  Sign in to access your secure referral workspace.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="username" className="block text-xs font-black text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <IconUser size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
                    <input
                      id="username"
                      type="text"
                      required
                      className="input-field pl-10 h-11"
                      placeholder="Enter your username"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-black text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <IconLock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="input-field pl-10 pr-11 h-11"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-primary-400 hover:text-primary-700 dark:hover:text-primary-200 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 text-error text-sm rounded-xl"
                    role="alert"
                    aria-live="polite"
                  >
                    <IconAlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full h-11 flex items-center justify-center gap-2 rounded-xl font-semibold"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying credentials...
                    </>
                  ) : (
                    'Sign In Securely'
                  )}
                </button>
              </form>

              <p className="mt-5 text-[11px] text-primary-500 text-center">
                By continuing, you agree to authorized clinical use policies.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
