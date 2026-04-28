import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({ title, description, badge, actions, icon }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pb-5 mb-6 border-b admin-hairline">
      <div className="min-w-0 flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--admin-accent-soft)', color: 'var(--admin-accent)' }}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[22px] lg:text-2xl font-semibold tracking-tight truncate" style={{ color: 'var(--admin-text)' }}>
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="mt-1 text-sm admin-text-muted">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
