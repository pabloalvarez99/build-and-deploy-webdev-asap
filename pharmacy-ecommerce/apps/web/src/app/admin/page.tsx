'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { isAdminRole, landingRouteForRole } from '@/lib/roles';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    if (!isAdminRole(user.role)) {
      router.replace('/');
      return;
    }
    router.replace(landingRouteForRole(user.role));
  }, [user, router]);

  return (
    <div data-admin="1" className="min-h-[60vh] flex items-center justify-center">
      <div className="admin-spinner" />
    </div>
  );
}
