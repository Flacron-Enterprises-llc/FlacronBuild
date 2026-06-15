
'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface SignUpStepOneProps {
  fullName: string;
  setFullName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  error: string | null;
  loading: boolean;
  handleEmailAuth: (e: React.FormEvent) => void;
}

export default function SignUpStepOne({
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  error,
  loading,
  handleEmailAuth,
}: SignUpStepOneProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <form onSubmit={handleEmailAuth} className="flex flex-col gap-3 w-full">
      <div className="w-full">
        <label className="text-xs font-medium text-gray-700 mb-1 block">
          Full Name <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoFocus
          className="w-full"
        />
      </div>

      <div className="w-full">
        <label className="text-xs font-medium text-gray-700 mb-1 block">
          Email <span className="text-red-500">*</span>
        </label>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full"
        />
      </div>

      <div className="w-full">
        <label className="text-xs font-medium text-gray-700 mb-1 block">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative w-full">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="w-full">
        <label className="text-xs font-medium text-gray-700 mb-1 block">
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <div className="relative w-full">
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm text-center break-words">{error}</div>
      )}

      <Button
        type="submit"
        className="w-full mt-1"
        disabled={loading || !fullName || !email || !password || !confirmPassword}
      >
        {loading ? 'Please wait…' : 'Continue'}
      </Button>
    </form>
  );
}
