'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/core/context/auth-context';
import { OnboardingGuard } from '@/components/OnboardingGuard';

function OnboardingContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationEmail: '',
    branchName: '',
    branchCity: '',
    branchPostalCode: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateOrganization = async () => {
    setError(null);
    setLoading(true);

    if (!formData.organizationName) {
      setError('Organization name is required');
      setLoading(false);
      return;
    }

    try {
      // Create organization in database
      const response = await fetch('/api/admin/organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.organizationName,
          email: formData.organizationEmail || user?.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create organization');
      }

      // Move to next step
      setStep(2);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create organization';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    setError(null);
    setLoading(true);

    if (!formData.branchName) {
      setError('Branch name is required');
      setLoading(false);
      return;
    }

    try {
      // Create branch in database
      const response = await fetch('/api/admin/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.branchName,
          city: formData.branchCity,
          postalCode: formData.branchPostalCode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create branch');
      }

      // Move to completion
      setStep(3);
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create branch';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">ThuisZorgHub</h1>
          <p className="text-gray-600 text-sm mt-2">Set up your organization</p>
          <div className="mt-6 flex justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${
                  s <= step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Create Organization</h2>
              <p className="text-sm text-gray-600">Start by setting up your organization</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name
                </label>
                <input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  value={formData.organizationName}
                  onChange={handleChange}
                  placeholder="e.g., Amsterdam Homecare"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="organizationEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Email
                </label>
                <input
                  id="organizationEmail"
                  name="organizationEmail"
                  type="email"
                  value={formData.organizationEmail}
                  onChange={handleChange}
                  placeholder={user?.email}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                onClick={handleCreateOrganization}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Organization'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Create First Branch</h2>
              <p className="text-sm text-gray-600">Set up your first office location</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="branchName" className="block text-sm font-medium text-gray-700 mb-1">
                  Branch Name
                </label>
                <input
                  id="branchName"
                  name="branchName"
                  type="text"
                  value={formData.branchName}
                  onChange={handleChange}
                  placeholder="e.g., Amsterdam Main Office"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="branchCity" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  id="branchCity"
                  name="branchCity"
                  type="text"
                  value={formData.branchCity}
                  onChange={handleChange}
                  placeholder="Amsterdam"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="branchPostalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  id="branchPostalCode"
                  name="branchPostalCode"
                  type="text"
                  value={formData.branchPostalCode}
                  onChange={handleChange}
                  placeholder="1012 AB"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateBranch}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Branch'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 text-center">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Setup Complete</h2>
              <p className="text-sm text-gray-600 mt-2">Your organization is ready to use</p>
            </div>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <OnboardingGuard>
      <OnboardingContent />
    </OnboardingGuard>
  );
}
