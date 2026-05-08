import { ShoppingBag, ClipboardList, CreditCard, Check } from 'lucide-react';

type Step = 1 | 2 | 3;

const STEPS = [
  { id: 1, label: 'Carrito', Icon: ShoppingBag },
  { id: 2, label: 'Datos', Icon: ClipboardList },
  { id: 3, label: 'Pago', Icon: CreditCard },
] as const;

export default function CheckoutProgress({ current }: { current: Step }) {
  return (
    <nav aria-label="Progreso de compra" className="mb-5">
      <ol className="flex items-center justify-between max-w-md mx-auto">
        {STEPS.map((step, idx) => {
          const done = step.id < current;
          const active = step.id === current;
          const Icon = step.Icon;
          return (
            <li key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  aria-current={active ? 'step' : undefined}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 transition-colors ${
                    done
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : active
                      ? 'bg-cyan-600 border-cyan-600 text-white shadow-md shadow-cyan-600/30'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400'
                  }`}
                >
                  {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span
                  className={`text-xs font-semibold ${
                    active
                      ? 'text-cyan-700 dark:text-cyan-400'
                      : done
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 mb-5 transition-colors ${
                    step.id < current ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
