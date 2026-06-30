import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">ThuisZorgHub</h1>
          <p className="text-gray-600 text-sm mt-2">Smart Software for Modern Homecare</p>
        </div>
        {children}
      </div>
    </div>
  );
}
