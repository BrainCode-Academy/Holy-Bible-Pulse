import React, { useState, useEffect, useRef } from 'react';
import { useBible } from '../../context/BibleContext';
import { requestPasswordReset, resetPassword } from '../../services/authApi';
import { APP_LOGO, APP_LOGO_ALT } from '../../constants/assets';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalMode, closeAuthModal, openAuthModal, login, register, loginGoogle } = useBible();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [demoResetToken, setDemoResetToken] = useState<string | null>(null);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authModalMode) {
      setMode(authModalMode);
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setDemoResetToken(null);
  }, [authModalMode, authModalOpen]);

  // Initialize Google Sign-In button if script loaded
  useEffect(() => {
    if (!authModalOpen) return;

    const initGoogle = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (clientId && window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: any) => {
              if (response.credential) {
                setIsLoading(true);
                setErrorMessage(null);
                try {
                  await loginGoogle(response.credential, clientId);
                } catch (err: any) {
                  setErrorMessage(err.message || 'Google sign-in failed');
                } finally {
                  setIsLoading(false);
                }
              }
            },
          });

          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: mode === 'register' ? 'signup_with' : 'signin_with',
            shape: 'rectangular',
          });
        } catch (e) {
          console.warn('Google Identity button initialization failed:', e);
        }
      }
    };

    const timer = setTimeout(initGoogle, 200);
    return () => clearTimeout(timer);
  }, [authModalOpen, mode]);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          throw new Error('Please enter both email and password.');
        }
        await login(email.trim(), password);
      } else if (mode === 'register') {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (!email.trim()) {
          throw new Error('Please enter a valid email address.');
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        await register(fullName.trim(), email.trim(), password, confirmPassword);
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          throw new Error('Please enter your account email.');
        }
        const res = await requestPasswordReset(email.trim());
        setSuccessMessage(res.message);
        if (res.resetToken) {
          setDemoResetToken(res.resetToken);
          setResetToken(res.resetToken);
        }
      } else if (mode === 'reset') {
        if (!resetToken.trim()) {
          throw new Error('Please enter the reset token.');
        }
        if (newPassword.length < 8) {
          throw new Error('New password must be at least 8 characters long.');
        }
        const res = await resetPassword(resetToken.trim(), newPassword);
        setSuccessMessage(res.message + ' You can now sign in with your new password.');
        setTimeout(() => {
          setMode('login');
          setSuccessMessage(null);
        }, 2500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        id="auth-modal-card"
        className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <img
              src={APP_LOGO}
              alt={APP_LOGO_ALT}
              className="w-11 h-11 rounded-xl object-cover border border-amber-500/30 shadow-md shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 font-serif">
                {mode === 'login' && 'Sign In to Holy Bible+'}
                {mode === 'register' && 'Create Your Account'}
                {mode === 'forgot' && 'Reset Password'}
                {mode === 'reset' && 'Enter New Password'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {mode === 'login' && 'Sync bookmarks, notes, highlights, and plans across devices'}
                {mode === 'register' && 'Join Holy Bible+ to backup and access your spiritual journey'}
                {mode === 'forgot' && 'Enter your email to receive password reset instructions'}
                {mode === 'reset' && 'Set a strong password for your account'}
              </p>
            </div>
          </div>
          <button
            id="auth-modal-close-btn"
            onClick={closeAuthModal}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Error Message */}
          {errorMessage && (
            <div
              id="auth-error-banner"
              className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-red-700 dark:text-red-300 text-sm flex items-start gap-2.5"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div
              id="auth-success-banner"
              className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm flex items-start gap-2.5"
            >
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                {successMessage}
                {demoResetToken && (
                  <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/40">
                    <span className="font-semibold block mb-1">Reset Code for Verification:</span>
                    <code className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 rounded font-mono text-xs select-all text-emerald-900 dark:text-emerald-200">
                      {demoResetToken}
                    </code>
                    <button
                      type="button"
                      onClick={() => setMode('reset')}
                      className="block mt-2 text-xs font-semibold underline hover:opacity-80"
                    >
                      Click here to enter new password with this code &rarr;
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name for Registration */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input
                    id="register-fullname-input"
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600 dark:focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            {mode !== 'reset' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600 dark:focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Password for Login and Register */}
            {(mode === 'login' || mode === 'register') && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-xs text-amber-700 dark:text-amber-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input
                    id="auth-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600 dark:focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password for Registration */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input
                    id="register-confirm-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600 dark:focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Reset Token & New Password for Reset Mode */}
            {mode === 'reset' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Reset Token / Code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                    <input
                      id="reset-token-input"
                      type="text"
                      required
                      placeholder="Paste reset token here"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600 dark:focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                    <input
                      id="reset-new-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600 dark:focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-white font-medium text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'register' && 'Create Free Account'}
                  {mode === 'forgot' && 'Send Password Reset Link'}
                  {mode === 'reset' && 'Update Password'}
                </>
              )}
            </button>
          </form>

          {/* Social Sign-In / Google */}
          {(mode === 'login' || mode === 'register') && (
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
              <div className="relative flex py-2 items-center justify-center mb-3">
                <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
                <span className="flex-shrink mx-3 text-xs text-stone-400 uppercase tracking-wider font-semibold">
                  Or continue with
                </span>
                <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
              </div>

              {/* Google Button Container */}
              <div className="flex justify-center">
                <div ref={googleBtnRef} id="google-signin-target" className="min-h-[44px]">
                  {/* Fallback Google styled button if script is blocked */}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('Google OAuth is pending production domain configuration. Please use email & password sign-in or create a new account.');
                    }}
                    className="w-full py-2.5 px-4 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-200 flex items-center justify-center gap-2 transition"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    Continue with Google
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <div className="pt-2 text-center flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
            <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>Encrypted passwords &amp; private cloud sync</span>
          </div>
        </div>

        {/* Footer Switching Mode */}
        <div className="px-6 py-4 bg-stone-50 dark:bg-stone-800/50 border-t border-stone-100 dark:border-stone-800 text-center text-xs text-stone-600 dark:text-stone-400">
          {mode === 'login' && (
            <span>
              Don’t have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-semibold text-amber-700 dark:text-amber-400 hover:underline"
              >
                Create Account
              </button>
            </span>
          )}

          {mode === 'register' && (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-semibold text-amber-700 dark:text-amber-400 hover:underline"
              >
                Sign In
              </button>
            </span>
          )}

          {(mode === 'forgot' || mode === 'reset') && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="font-semibold text-amber-700 dark:text-amber-400 hover:underline"
            >
              &larr; Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
