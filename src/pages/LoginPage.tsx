"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, User, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { isUserAdmin } from '@/lib/api';

interface LoginPageProps {
  mode?: 'admin' | 'student';
}

export default function LoginPage({ mode = 'admin' }: LoginPageProps) {
  const router = useRouter();
  const { signIn, signUp, signOut, user, loading, isAdmin } = useAuth();
  const isAdminMode = mode === 'admin';
  const canSignUp = !isAdminMode;

  // Redirect to home if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (isAdminMode) {
        router.replace(isAdmin ? '/admin' : '/search');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, router, isAdminMode, isAdmin]);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignUp && canSignUp) {
      const nameTrimmed = formData.username.trim();
      const nameParts = nameTrimmed.split(/\s+/).filter(Boolean);

      if (!nameTrimmed) {
        setError('First and last name are required');
        return;
      }
      if (nameParts.length < 2) {
        setError('Please enter both first and last name');
        return;
      }
      if (/[^a-zA-Z' -]/.test(nameTrimmed)) {
        setError('Names can only include letters, spaces, hyphens, and apostrophes');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error: authError } = await signUp(formData.email, formData.password, formData.username);
        if (authError) {
          setError(authError.message || 'Sign up failed');
          toast.error('Sign up failed', {
            description: authError.message,
          });
        } else {
          toast.success('Account created!');
          setIsSignUp(false);
          setFormData({ email: formData.email, password: '', confirmPassword: '', username: '' });
          router.push('/student-login');
        }
      } else {
        const { error: authError } = await signIn(formData.email, formData.password);
        if (authError) {
          setError(authError.message || 'Sign in failed');
          toast.error('Sign in failed', {
            description: authError.message,
          });
        } else {
          toast.success('Welcome back!');
          if (isAdminMode) {
            const { data: authData } = await supabase.auth.getUser();
            const admin = authData.user ? await isUserAdmin(authData.user.id) : false;

            if (!admin) {
              await signOut();
              setError('Admin account required. Use Student Login for student access.');
              toast.error('Access denied', {
                description: 'This login is for administrators only.',
              });
              return;
            }

            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <Layout>
        <section className="py-12 md:py-20 min-h-screen flex items-center">
          <div className="container-narrow">
            <div className="max-w-md mx-auto text-center">
              <div className="h-8 w-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // Don't render login form if already logged in (will redirect)
  if (user) {
    return null;
  }

  return (
    <Layout>
      <section className="min-h-screen w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 md:py-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="text-center mb-8 sm:mb-10">
            <div className="flex justify-center mb-4">
              <div className="inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg">
                <Building2 className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-3">
              {isSignUp ? 'Create Account' : isAdminMode ? 'Admin Sign In' : 'Student Sign In'}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
              {isSignUp
                ? 'Join the community to report, track, and claim items'
                : isAdminMode
                ? 'Access the admin dashboard to manage items'
                : 'Sign in to your account'}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3 animate-in">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* Full Name Field (Sign Up) */}
              {isSignUp && canSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Full Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="John Doe"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="pl-10 h-11 sm:h-12 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      minLength={3}
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">First and last name required</p>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Email Address *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@school.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 h-11 sm:h-12 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 h-11 sm:h-12 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Confirm Password Field (Sign Up) */}
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Confirm Password *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10 h-11 sm:h-12 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 sm:h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold mt-6 sm:mt-8 rounded-lg transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="hidden sm:inline">
                      {isSignUp ? 'Creating Account...' : 'Signing In...'}
                    </span>
                  </span>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  </>
                )}
              </Button>
            </form>

            {/* Toggle Sign Up/Sign In */}
            {canSignUp && (
              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-200 dark:border-slate-700 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setFormData({ email: '', password: '', confirmPassword: '', username: '' });
                  }}
                  className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                >
                  {isSignUp ? (
                    <>Already have an account? <span className="text-blue-600 dark:text-blue-400">Sign in</span></>
                  ) : (
                    <>Don't have an account? <span className="text-blue-600 dark:text-blue-400">Sign up</span></>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Back to Home Link */}
          <div className="mt-6 sm:mt-8 text-center">
            <Link
              href={isAdminMode ? '/student-login' : '/login'}
              className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              ← {isAdminMode ? 'Student Login' : 'Admin Login'}
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

