import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { LoginResponse, ErrorResponse } from '../../types/api';
import { IconShieldCheck, IconLock, IconUser, IconAlertCircle } from '@tabler/icons-react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-900 text-white rounded mb-4">
            <IconShieldCheck size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary-900 dark:text-white">TRMS</h1>
          <p className="text-sm text-primary-500 mt-1 uppercase tracking-widest">Clinical Access</p>
        </div>

        <div className="bg-white dark:bg-surface-900 border border-primary-200 dark:border-primary-800 rounded shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-primary-600 dark:text-primary-400 uppercase mb-2">
                Username
              </label>
              <div className="relative">
                <IconUser size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
                <input
                  type="text"
                  required
                  className="input-field pl-10"
                  placeholder="e.g. jdoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-primary-600 dark:text-primary-400 uppercase mb-2">
                Password
              </label>
              <div className="relative">
                <IconLock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
                <input
                  type="password"
                  required
                  className="input-field pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 text-error text-sm rounded">
                <IconAlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-primary-400">
            Tigray Regional Health Bureau — Official Referral Portal
          </p>
        </div>
      </div>
    </div>
  );
}
