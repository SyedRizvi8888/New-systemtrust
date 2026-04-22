"use client";

import Link from "next/link";
export function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 mt-auto">
      <div className="container-wide py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          {/* Contact */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3 uppercase tracking-wide text-xs">
              Contact information
            </h3>
            <div className="space-y-1 text-slate-600 dark:text-slate-400">
              <p>Student Services Office</p>
              <p>Room B114</p>
              <p>studentservices@school.edu</p>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3 uppercase tracking-wide text-xs">
              Office hours
            </h3>
            <div className="space-y-1 text-slate-600 dark:text-slate-400">
              <p>Monday – Friday</p>
              <p>8:00 AM – 3:30 PM</p>
              <p className="text-xs pt-2">Closed on school holidays</p>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3 uppercase tracking-wide text-xs">
              Quick links
            </h3>
            <div className="space-y-1">
              <Link href="/search" className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                View found items
              </Link>
              <Link href="/report" className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                Report lost item
              </Link>
              <Link href="/student-login" className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                Student login
              </Link>
              <Link href="/login" className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                Admin login
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 mt-8 pt-6 text-xs text-slate-500 dark:text-slate-500">
          <p>The school is not responsible for lost, stolen, or damaged personal property.</p>
          <p className="mt-2">&copy; {new Date().getFullYear()} School District. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
