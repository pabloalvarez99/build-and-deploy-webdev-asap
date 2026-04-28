import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
  elevated?: boolean;
}

export function Card({ children, className = '', header, footer, padded = true, elevated = false }: CardProps) {
  const surface = elevated ? 'admin-elevated' : 'admin-surface';
  return (
    <div className={`${surface} overflow-hidden ${className}`}>
      {header && (
        <div className="px-5 py-3.5 border-b admin-hairline flex items-center justify-between gap-3">
          {header}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t admin-hairline admin-text-muted text-xs">
          {footer}
        </div>
      )}
    </div>
  );
}
