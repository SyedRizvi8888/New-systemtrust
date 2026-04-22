import { ShieldCheck, Gauge, Smartphone, Eye } from 'lucide-react';

const pillars = [
  {
    title: 'Transparent tracking',
    description: 'Every report and claim is logged, timestamped, and visible through a clear status flow.',
    icon: Eye,
  },
  {
    title: 'Faster recovery',
    description: 'Structured intake and verification reduce manual delays and improve return times.',
    icon: Gauge,
  },
  {
    title: 'Trusted moderation',
    description: 'Student Services reviews submissions and verifies ownership before release.',
    icon: ShieldCheck,
  },
  {
    title: 'Mobile-first access',
    description: 'Students can browse, report, and track claims from phone, tablet, or desktop.',
    icon: Smartphone,
  },
];

export function StatsSection() {
  return (
    <section className="py-12 md:py-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="container-wide">
        <div className="max-w-3xl mb-8">
          <p className="text-xs uppercase tracking-wide font-semibold text-green-700 dark:text-green-300 mb-2">Why System Trust</p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
            Built for reliability, speed, and campus trust
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            System Trust combines institutional oversight with modern product UX so recovery is faster and easier for everyone.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-5">
              <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/35 flex items-center justify-center mb-3">
                <pillar.icon className="h-5 w-5 text-green-700 dark:text-green-300" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{pillar.title}</h3>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
