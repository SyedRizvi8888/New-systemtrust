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
      <section className="py-12 md:py-20 min-h-screen flex items-center bg-slate-50 dark:bg-slate-900">
        <div className="container-narrow">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg">
                  <Building2 className="h-8 w-8" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {isSignUp ? 'Create Student Account' : isAdminMode ? 'Administrator Sign In' : 'Student Sign In'}
              </h1>
              <p className="text-slate-600 dark:text-slate-300">
                {isSignUp
                  ? 'Register your student account for claims and item tracking'
                  : isAdminMode
                  ? 'Sign in to manage lost & found items'
                  : 'Sign in to report, track, and claim items'}
              </p>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}

                {isSignUp && canSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-slate-900 dark:text-slate-100">Full name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="First Last"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="pl-10 h-11 border-slate-300 dark:border-slate-600"
                        required
                        minLength={3}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enter first and last name. Letters, spaces, hyphens, and apostrophes only.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-900 dark:text-slate-100">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@school.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 h-11 border-slate-300 dark:border-slate-600"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-900 dark:text-slate-100">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 h-11 border-slate-300 dark:border-slate-600"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-900 dark:text-slate-100">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="pl-10 h-11 border-slate-300 dark:border-slate-600"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isSignUp ? 'Creating Account...' : 'Signing In...'}
                    </span>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      {isSignUp ? 'Create Account' : 'Sign In'}
                    </>
                  )}
                </Button>
              </form>

              {/* Toggle Sign Up/Sign In */}
              {canSignUp && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setFormData({ email: '', password: '', confirmPassword: '', username: '' });
                  }}
                  className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {isSignUp ? (
                    <>Already have an account? <span className="text-blue-600 dark:text-blue-400 font-semibold">Sign in</span></>
                  ) : (
                    <>Don't have an account? <span className="text-blue-600 dark:text-blue-400 font-semibold">Sign up</span></>
                  )}
                </button>
              </div>
              )}
            </div>

            {/* Back to Home */}
            <div className="mt-6 text-center">
              <Link
                href={isAdminMode ? '/student-login' : '/login'}
                className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {isAdminMode ? '← Student Login' : '← Admin Login'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

