"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Search,
  FileText,
  ShieldCheck,
  Clock3,
  QrCode,
  CheckCircle2,
  MapPin,
  Mail,
  TimerReset,
  Smartphone,
  ChevronRight,
} from 'lucide-react';

const trustStats = [
  { label: 'Items Returned', value: '142' },
  { label: 'Active Claims', value: '24' },
  { label: 'Avg Report Time', value: '< 2 min' },
  { label: 'Mobile Access', value: '100%' },
];

export function Hero() {
  return (
    <section className="bg-gradient-to-br from-white via-slate-50 to-green-100/20 dark:from-slate-900 dark:via-slate-900 dark:to-green-950/30 border-b border-green-200/70 dark:border-green-900/70">
      <div className="container-wide py-12 md:py-16">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start animate-fade-in-up">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-full mb-4">
              <ShieldCheck className="h-3.5 w-3.5 text-green-700 dark:text-green-300" />
              <p className="text-xs sm:text-sm font-medium text-green-800 dark:text-green-300">
                Official Student Services Platform
              </p>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
              Recover lost items faster.
              <span className="block text-green-600 dark:text-green-400">System Trust at Henry M. Jackson.</span>
            </h1>

            <p className="text-base md:text-lg text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed mb-7">
              The official digital lost-and-found platform for reporting, tracking, and verified item recovery across campus.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link href="/search">
                <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white btn-hover btn-press shadow-md hover:shadow-lg">
                  <Search className="h-4 w-4 mr-2" />
                  Browse found items
                </Button>
              </Link>
              <Link href="/report">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-green-600 text-green-700 hover:bg-green-50 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-950 btn-hover btn-press">
                  <FileText className="h-4 w-4 mr-2" />
                  Report an item
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {trustStats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/70 p-3">
                  <p className="text-lg font-bold text-slate-900 dark:text-white leading-none">{stat.value}</p>
                  <p className="text-[11px] mt-1 text-slate-600 dark:text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* <div className="relative">
            <div className="absolute -inset-3 bg-gradient-to-br from-green-200/30 to-slate-300/20 dark:from-green-800/30 dark:to-slate-700/20 blur-2xl rounded-3xl" />
            <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/85 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900 dark:text-white">Live Recovery Overview</h2>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Operational</span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">AirPods Pro Case</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Library · 2nd Floor</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">Pending review</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Black Nike Backpack</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Gym Entrance</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Claim verified</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Student ID Holder</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Student Services</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Returned</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-dashed border-green-400/70 dark:border-green-700 p-3 bg-green-50/60 dark:bg-green-950/20">
                  <div className="flex items-center gap-2 mb-1">
                    <QrCode className="h-4 w-4 text-green-700 dark:text-green-400" />
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">QR Quick Report</p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Scan to report in under 2 minutes.</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900/40">
                  <div className="flex items-center gap-2 mb-1">
                    <Smartphone className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">Mobile Ready</p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Claim status updates on any device.</p>
                </div>
              </div>
            </div>
          </div> */}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-900 text-slate-100 p-5 md:p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Clock3 className="h-4 w-4 text-green-300" />
            <p className="text-xs uppercase tracking-wide font-semibold text-green-300">Student Services Support Center</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-slate-300 mb-1 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Location</p>
              <p className="font-medium text-white">Room B114</p>
            </div>
            <div>
              <p className="text-slate-300 mb-1 flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Office Hours</p>
              <p className="font-medium text-white">8:00 AM – 3:30 PM</p>
            </div>
            <div>
              <p className="text-slate-300 mb-1 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />Contact</p>
              <p className="font-medium text-white">studentservices@school.edu</p>
            </div>
            <div>
              <p className="text-slate-300 mb-1 flex items-center gap-1.5"><TimerReset className="h-3.5 w-3.5" />Retention</p>
              <p className="font-medium text-white">30 days · 90 for valuables</p>
            </div>
            <div>
              <p className="text-slate-300 mb-1 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />Priority</p>
              <p className="font-medium text-white">Same-day review for urgent items</p>
            </div>
          </div>
          <Link href="/claims" className="inline-flex items-center gap-1.5 mt-4 text-green-300 hover:text-green-200 text-sm font-medium">
            Track my claim status
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
