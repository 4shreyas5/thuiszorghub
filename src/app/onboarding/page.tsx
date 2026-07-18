"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/core/context/auth-context";
import { OnboardingGuard } from "@/components/OnboardingGuard";

interface FormData {
  // Organization details
  name: string;
  legalName: string;
  email: string;
  phone: string;
  website: string;

  // Registration details
  kvkNumber: string;
  vatNumber: string;

  // Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;

  // Settings
  primaryLanguage: string;
  timezone: string;
  currency: string;
}

function OnboardingContent() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    legalName: "",
    email: user?.email || "",
    phone: "",
    website: "",
    kvkNumber: "",
    vatNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: "NL",
    primaryLanguage: "nl",
    timezone: "Europe/Amsterdam",
    currency: "EUR",
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = "Organization name is required";
    }
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!formData.email.includes("@")) {
      errors.email = "Valid email is required";
    }
    if (!formData.addressLine1.trim()) {
      errors.addressLine1 = "Address is required";
    }
    if (!formData.city.trim()) {
      errors.city = "City is required";
    }
    if (!formData.postalCode.trim()) {
      errors.postalCode = "Postal code is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof FormData]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          legalName: formData.legalName,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          kvkNumber: formData.kvkNumber,
          vatNumber: formData.vatNumber,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          primaryLanguage: formData.primaryLanguage,
          timezone: formData.timezone,
          currency: formData.currency,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create organization");
      }

      // Refresh user profile to get organization_id
      await refreshUser();

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin");
      }, 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create organization";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete</h2>
          <p className="text-gray-600">Your organization has been successfully created</p>
          <p className="text-sm text-gray-500 mt-4">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">ThuisZorgHub</h1>
          <p className="text-gray-600">Set up your organization</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Organization Details Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Organization Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Amsterdam Homecare"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                      formErrors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={loading}
                  />
                  {formErrors.name && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name</label>
                  <input
                    type="text"
                    name="legalName"
                    value={formData.legalName}
                    onChange={handleChange}
                    placeholder="Full legal name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="organization@example.com"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                      formErrors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={loading}
                  />
                  {formErrors.email && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+31 6 12345678"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Registration Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Registration Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KVK Number</label>
                  <input
                    type="text"
                    name="kvkNumber"
                    value={formData.kvkNumber}
                    onChange={handleChange}
                    placeholder="12345678"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VAT Number</label>
                  <input
                    type="text"
                    name="vatNumber"
                    value={formData.vatNumber}
                    onChange={handleChange}
                    placeholder="NL123456789B01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    placeholder="123 Main Street"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                      formErrors.addressLine1 ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={loading}
                  />
                  {formErrors.addressLine1 && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.addressLine1}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    placeholder="Apartment, suite, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Amsterdam"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                      formErrors.city ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={loading}
                  />
                  {formErrors.city && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="1012 AB"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                      formErrors.postalCode ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={loading}
                  />
                  {formErrors.postalCode && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.postalCode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    disabled={loading}
                  >
                    <option value="NL">Netherlands</option>
                    <option value="BE">Belgium</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="GB">United Kingdom</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Preferences</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select
                    name="primaryLanguage"
                    value={formData.primaryLanguage}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    disabled={loading}
                  >
                    <option value="nl">Dutch (NL)</option>
                    <option value="en">English (EN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    disabled={loading}
                  >
                    <option value="Europe/Amsterdam">Europe/Amsterdam (CET)</option>
                    <option value="Europe/Brussels">Europe/Brussels (CET)</option>
                    <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    disabled={loading}
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition"
            >
              {loading ? "Creating Organization..." : "Create Organization"}
            </button>

            <p className="text-xs text-gray-500 text-center">* Required fields</p>
          </form>
        </div>
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
