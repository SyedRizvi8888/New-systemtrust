/**
 * User Profile Page
 * 
 * Allows users to view and edit their profile information including:
 * - Email address (read-only, from auth)
 * - Username (customizable, must be unique)
 * - Full name (optional)
 * 
 * @page ProfilePage
 */

"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { User, Mail, Save } from 'lucide-react';

/**
 * ProfilePage Component
 * Renders user profile management interface
 */

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (!user) {
      router.replace('/student-login');
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "not found" which is okay for new users
          console.error('Error loading profile:', error);
          toast.error('Failed to load profile');
        } else if (data) {
          setUsername(data.username ?? '');
          setFullName(data.full_name ?? '');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [user, router]);

  const handleSave = async () => {
    if (!user) return;

    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }

    if (username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          username: username.trim(),
          full_name: fullName.trim() || null,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation
          toast.error('Username is already taken');
        } else {
          toast.error('Failed to save profile');
        }
        console.error('Profile save error:', error);
      } else {
        toast.success('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <Layout>
        <section className="py-12 md:py-20">
          <div className="container-narrow">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-48 bg-muted rounded" />
              <div className="h-12 w-full bg-muted rounded" />
              <div className="h-12 w-full bg-muted rounded" />
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12 md:py-20 bg-gradient-to-br from-white via-green-50/30 to-green-100/20 dark:from-slate-900 dark:via-slate-900 dark:to-green-950/30 min-h-screen">
        <div className="container-narrow">
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-8">
              <User className="h-6 w-6 text-accent" />
              <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  <Mail className="inline-block h-4 w-4 mr-2" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email ?? ''}
                  disabled
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-foreground">
                  <User className="inline-block h-4 w-4 mr-2" />
                  Username *
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-xs text-muted-foreground">
                  Letters, numbers, and underscores only. Minimum 3 characters.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name (optional)"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving || !username.trim()}
                  className="w-full md:w-auto gap-2"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

