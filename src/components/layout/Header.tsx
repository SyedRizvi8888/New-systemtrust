/**
 * Header Component
 * 
 * Main navigation bar for the Lost & Found application
 * Features:
 * - Logo and branding
 * - Desktop navigation links
 * - Mobile hamburger menu
 * - User authentication status
 * - Sign out functionality
 * 
 * @component Header
 */

"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, Home, Search, FileText, User, LogOut, Shield, ClipboardList, Archive, LayoutDashboard } from 'lucide-react';

/**
 * Header Component
 * Renders the main navigation bar with responsive design
 */
export function Header() {
  const { user, signOut, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b-2 border-green-600 dark:border-green-500 sticky top-0 z-50 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <Link href="/" className="flex items-center gap-2 text-slate-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-smooth flex-shrink-0">
            <span className="text-base sm:text-lg font-bold">Henry M. Jackson</span>
            {user && !isAdmin && (
              <span className="hidden sm:inline-flex items-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 text-xs font-semibold">
                Student
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5">
            <Link
              href="/"
              className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950 rounded transition-colors"
            >
              Home
            </Link>
            {user && !isAdmin && (
              <Link
                href="/dashboard"
                className="px-3 py-2 text-sm font-medium text-green-700 dark:text-green-300 hover:text-green-600 dark:hover:text-green-200 hover:bg-green-50 dark:hover:bg-green-950 rounded transition-colors"
              >
                Dashboard
              </Link>
            )}
            <Link
              href="/search"
              className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950 rounded transition-colors"
            >
              Browse
            </Link>
            <Link
              href="/report"
              className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950 rounded transition-colors"
            >
              Report
            </Link>
            {user && (
              <Link
                href="/claims"
                className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950 rounded transition-colors"
              >
                Claims
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950 rounded transition-colors"
              >
                Admin
              </Link>
            )}
            <span className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-2" />
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950 rounded transition-colors"
                >
                  Account
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-1">
                <Link href="/student-login">
                  <Button variant="ghost" size="sm" className="text-sm text-slate-700 dark:text-slate-300">
                    Student
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-sm text-slate-700 dark:text-slate-300">
                    Admin
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu */}
          <div className="lg:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 mt-6">
                  <Link
                    href="/"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-green-950 rounded transition-colors"
                  >
                    <Home className="h-5 w-5" />
                    Home
                  </Link>
                  {user && !isAdmin && (
                    <Link
                      href="/dashboard"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950 rounded transition-colors"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Dashboard
                    </Link>
                  )}
                  <Link
                    href="/search"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-green-950 rounded transition-colors"
                  >
                    <Search className="h-5 w-5" />
                    Browse Items
                  </Link>
                  <Link
                    href="/report"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-green-950 rounded transition-colors"
                  >
                    <FileText className="h-5 w-5" />
                    Report Item
                  </Link>
                  {user && (
                    <Link
                      href="/claims"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-green-950 rounded transition-colors"
                    >
                      <ClipboardList className="h-5 w-5" />
                      My Claims
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-green-950 rounded transition-colors"
                    >
                      <Shield className="h-5 w-5" />
                      Administration
                    </Link>
                  )}
                  <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
                  {user ? (
                    <>
                      <Link
                        href="/profile"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-green-950 rounded transition-colors"
                      >
                        <User className="h-5 w-5" />
                        Account
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-green-950 rounded text-left w-full transition-colors"
                      >
                        <LogOut className="h-5 w-5" />
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/student-login"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950 rounded transition-colors"
                      >
                        <User className="h-5 w-5" />
                        Student Login
                      </Link>
                      <Link
                        href="/login"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-green-950 rounded transition-colors"
                      >
                        <Shield className="h-5 w-5" />
                        Admin Login
                      </Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
