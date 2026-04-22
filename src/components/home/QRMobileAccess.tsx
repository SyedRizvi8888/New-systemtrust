import { QrCode, Smartphone, Search, FileText, Send } from 'lucide-react';

const quickActions = [
  {
    title: 'Report found item',
    description: 'Submit details quickly from hallways, office desk, or classroom.',
    icon: FileText,
  },
  {
    title: 'Browse found items',
    description: 'Search active listings by category, date, and location in seconds.',
    icon: Search,
  },
  {
    title: 'Submit claim',
    description: 'Send ownership proof and track approval status on your phone.',
    icon: Send,
  },
];

export function QRMobileAccess() {
  return (
    <section className="py-12 md:py-16 bg-slate-50 dark:bg-slate-800/60 border-y border-slate-200 dark:border-slate-700">
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xs uppercase tracking-wide font-semibold text-green-700 dark:text-green-300 mb-2">QR Mobile Access</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
              Scan and report instantly across campus
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-2xl">
              Place QR posters in Student Services, library, and hallways so students can report items, browse listings, and submit claims from any device.
            </p>

            <div className="space-y-3">
              {quickActions.map((item) => (
                <div key={item.title} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900/35 flex items-center justify-center shrink-0">
                      <item.icon className="h-4.5 w-4.5 text-green-700 dark:text-green-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{item.title}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-6 flex flex-col items-center justify-center text-center">
              <div className="h-36 w-36 rounded-xl border-2 border-dashed border-green-500/70 dark:border-green-700 flex items-center justify-center mb-4 bg-green-50 dark:bg-green-950/20">
                <QrCode className="h-16 w-16 text-green-700 dark:text-green-300" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Campus QR Portal</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Scan to open report and search actions instantly</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 h-full">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Mobile Preview</p>
                </div>
                <div className="space-y-2">
                  <div className="rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 text-xs text-slate-700 dark:text-slate-300">Browse found items</div>
                  <div className="rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 text-xs text-slate-700 dark:text-slate-300">Report lost item</div>
                  <div className="rounded-md bg-green-600 text-white p-2 text-xs">Submit verified claim</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
