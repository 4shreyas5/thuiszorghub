'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthActions } from '@/hooks/useAuthActions';

export default function ForgotPasswordPage() {
  const { requestPasswordReset, isLoading, error } = useAuthActions();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email) {
      setLocalError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    try {
      await requestPasswordReset({ email });
      setSubmitted(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send reset email. Please try again.';
      setLocalError(errorMsg);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>
          <p className="text-gray-600 text-sm mt-2">Password reset instructions have been sent to {email}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            Click the link in the email to reset your password. The link will expire in 24 hours.
          </p>
        </div>

        <div className="text-center text-sm text-gray-600">
          Didn&apos;t receive the email?{' '}
          <button
            onClick={() => {
              setSubmitted(false);
              setEmail('');
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Try again
          </button>
        </div>

        <div className="text-center text-sm text-gray-600">
          <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
        <p className="text-gray-600 text-sm mt-2">Enter your email to receive password reset instructions</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            disabled={isLoading}
          />
        </div>

        {(localError || error) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm font-medium">{localError || error?.message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="text-center text-sm text-gray-600">
        <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
          Back to login
        </Link>
      </div>
    </div>
  );
}
