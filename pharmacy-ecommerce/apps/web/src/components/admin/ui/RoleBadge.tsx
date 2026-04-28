import { roleLabel } from '@/lib/roles';

const STYLES: Record<string, { bg: string; fg: string; border: string }> = {
  owner:      { bg: 'rgba(139, 92, 246, 0.10)',  fg: '#7c3aed', border: 'rgba(139, 92, 246, 0.25)' },
  admin:      { bg: 'rgba(139, 92, 246, 0.10)',  fg: '#7c3aed', border: 'rgba(139, 92, 246, 0.25)' },
  pharmacist: { bg: 'rgba(16, 185, 129, 0.10)',  fg: '#059669', border: 'rgba(16, 185, 129, 0.25)' },
  seller:     { bg: 'rgba(59, 130, 246, 0.10)',  fg: '#2563eb', border: 'rgba(59, 130, 246, 0.25)' },
  user:       { bg: 'rgba(120, 120, 135, 0.12)', fg: '#5b5b6b', border: 'rgba(120, 120, 135, 0.25)' },
};

export function RoleBadge({ role, size = 'sm' }: { role: string; size?: 'xs' | 'sm' }) {
  const s = STYLES[role] ?? STYLES.user;
  const padding = size === 'xs' ? 'px-1.5 py-0.5 text-[10.5px]' : 'px-2 py-0.5 text-[11px]';
  return (
    <span
      className={`inline-flex items-center gap-1 ${padding} rounded-full font-medium border`}
      style={{ background: s.bg, color: s.fg, borderColor: s.border }}
    >
      {roleLabel(role)}
    </span>
  );
}
