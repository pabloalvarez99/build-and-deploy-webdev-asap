import { ReactNode } from 'react';

interface DataTableProps {
  children: ReactNode;
  className?: string;
}

export function DataTable({ children, className = '' }: DataTableProps) {
  return (
    <div className={`admin-surface overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="admin-table w-full">{children}</table>
      </div>
    </div>
  );
}
