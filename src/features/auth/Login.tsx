import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { LoginResponse, ErrorResponse } from '../../types/api';
import {
  IconLock,
  IconUser,
  IconAlertCircle,
  IconEye,
  IconEyeOff,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 font-sans flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Architecture Graphic (above the card) */}
        <div className="mb-8 flex justify-center">
          <div className="w-48 h-24 relative">
            <svg viewBox="0 0 200 100" className="w-full h-full text-primary-600 dark:text-primary-400">
              <rect x="10" y="30" width="40" height="30" rx="6" fill="currentColor" opacity="0.3" />
              <rect x="80" y="15" width="40" height="40" rx="6" fill="currentColor" opacity="0.5" />
              <rect x="150" y="35" width="40" height="30" rx="6" fill="currentColor" opacity="0.7" />
              <path d="M50 45 L80 35" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
              <path d="M120 35 L150 45" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
              <circle cx="65" cy="50" r="3" fill="currentColor" />
              <circle cx="135" cy="50" r="3" fill="currentColor" />
              <text x="12" y="22" fontSize="6" fill="currentColor">Health Post</text>
              <text x="82" y="10" fontSize="6" fill="currentColor">General Hospital</text>
              <text x="152" y="25" fontSize="6" fill="currentColor">Specialized</text>
            </svg>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
              Secure referral network
            </p>
          </div>
        </div>

        {/* Authentication Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Sign in to your TRMS workspace
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IconUser size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                    placeholder="your_username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IconLock size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
                  <IconAlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-sm transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
              Tigray Regional Health Bureau — Official Referral Portal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}