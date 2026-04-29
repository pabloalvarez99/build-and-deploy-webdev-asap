'use client';

import { Heart, Sparkles } from 'lucide-react';

export interface HealthBreakdownItem {
  key: string;
  label: string;
  weight: number;
  score: number;
  hint: string;
}

export interface HealthData {
  score: number;
  label: string;
  breakdown: HealthBreakdownItem[];
  suggestion: string;
}

function colorForScore(s: number) {
  if (s >= 90) return '#10b981';
  if (s >= 80) return '#22c55e';
  if (s >= 65) return '#6366f1';
  if (s >= 50) return '#f59e0b';
  return '#ef4444';
}

export function HealthScoreCard({ data }: { data: HealthData }) {
  const { score, label, breakdown, suggestion } = data;
  const color = colorForScore(score);

  const radius = 70;
  const stroke = 10;
  const circumference = Math.PI * radius;
  const dash = (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className="admin-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4" style={{ color }} />
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--admin-text)' }}>
            Health Score del negocio
          </h3>
        </div>
        <span
          className="px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider rounded-md border"
          style={{ borderColor: `${color}55`, color, background: `${color}14` }}
        >
          {label}
        </span>
      </div>

      <div className="grid md:grid-cols-[180px_1fr] gap-6 items-center">
        {/* Dial SVG */}
        <div className="flex flex-col items-center justify-center">
          <svg viewBox="0 0 180 110" className="w-[180px] h-[110px]">
            <path
              d={`M ${90 - radius} 95 A ${radius} ${radius} 0 0 1 ${90 + radius} 95`}
              fill="none"
              stroke="var(--admin-surface-2)"
              strokeWidth={stroke}
              strokeLinecap="round"
            />
            <path
              d={`M ${90 - radius} 95 A ${radius} ${radius} 0 0 1 ${90 + radius} 95`}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              style={{ transition: 'stroke-dasharray 600ms cubic-bezier(0.16,1,0.3,1)' }}
            />
            <text x="90" y="80" textAnchor="middle" className="tabular-nums" style={{ fill: 'var(--admin-text)', fontSize: 32, fontWeight: 700 }}>
              {score}
            </text>
            <text x="90" y="98" textAnchor="middle" style={{ fill: 'var(--admin-text-subtle, #888)', fontSize: 10, letterSpacing: 1 }}>
              / 100
            </text>
          </svg>
          {suggestion && (
            <div className="mt-2 flex items-start gap-1.5 px-3 py-2 rounded-lg text-[11.5px]"
              style={{ background: 'var(--admin-surface-2)', color: 'var(--admin-text)' }}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color }} />
              <span>{suggestion}</span>
            </div>
          )}
        </div>

        {/* Breakdown */}
        <div className="space-y-2.5">
          {breakdown.map((b) => {
            const c = colorForScore(b.score);
            return (
              <div key={b.key}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span style={{ color: 'var(--admin-text)' }} className="font-medium">
                    {b.label}
                    <span className="admin-text-subtle font-normal ml-1.5 text-[11px]">{b.weight}%</span>
                  </span>
                  <span className="tabular-nums font-semibold" style={{ color: c }}>{b.score}</span>
                </div>
                <div className="relative mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--admin-surface-2)' }}>
                  <div
                    className="absolute inset-y-0 left-0 transition-all duration-500"
                    style={{ width: `${b.score}%`, background: c }}
                  />
                </div>
                <p className="text-[11px] admin-text-subtle mt-0.5">{b.hint}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
