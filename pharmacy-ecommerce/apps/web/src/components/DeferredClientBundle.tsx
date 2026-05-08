'use client';

import dynamic from 'next/dynamic';

const PWARegister = dynamic(() => import('./PWARegister').then(m => m.PWARegister), { ssr: false });
const InstallPWAButton = dynamic(() => import('./InstallPWAButton').then(m => m.InstallPWAButton), { ssr: false });
const PushOptInButton = dynamic(() => import('./PushOptInButton').then(m => m.PushOptInButton), { ssr: false });

export function DeferredClientBundle() {
  return (
    <>
      <PWARegister />
      <InstallPWAButton />
      <PushOptInButton />
    </>
  );
}
