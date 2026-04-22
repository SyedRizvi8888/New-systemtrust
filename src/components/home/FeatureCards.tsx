import { ClipboardPlus, ShieldCheck, FileCheck2, PackageCheck, ArrowRight } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Item is reported',
    description: 'Students or staff submit a found or lost item through the office or mobile report flow.',
    icon: ClipboardPlus,
  },
  {
    id: 2,
    title: 'Office catalogs and verifies',
    description: 'Student Services records category, location, and date, then secures the item in storage.',
    icon: ShieldCheck,
  },
  {
    id: 3,
    title: 'Claim is submitted',
    description: 'Students provide identifying proof and contact details to initiate ownership verification.',
    icon: FileCheck2,
  },
  {
    id: 4,
    title: 'Claim is resolved',
    description: 'Office reviews and closes the case with in-person pickup and status tracking.',
    icon: PackageCheck,
  },
];

export function FeatureCards() {
  return (
    <section className="py-12 md:py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
      <div className="container-wide">
        <div className="animate-fade-in-up">
          <div className="max-w-3xl mb-8">
            <p className="text-xs uppercase tracking-wide font-semibold text-green-700 dark:text-green-300 mb-2">How it works</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
              End-to-end campus recovery workflow
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Every item follows a structured process so students get transparent updates from report to resolution.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {steps.map((step, index) => (
              <div key={step.id} className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-5 hover:border-green-400/70 dark:hover:border-green-700 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-sm font-semibold">
                    {step.id}
                  </span>
                  <step.icon className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{step.description}</p>

                {index < steps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-3 top-9 h-4 w-4 text-slate-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
