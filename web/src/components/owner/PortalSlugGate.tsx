'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

export function PortalSlugGate() {
  const router = useRouter();
  const [slug, setSlug] = useState('');

  function go(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (cleaned) {
      router.push(`/portal/${cleaned}`);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold">כניסה לניהול העסק</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          הזינו את מזהה העסק (slug) כפי שמופיע בקישור ההזמנה ללקוחות, למשל{' '}
          <code className="rounded bg-muted px-1">my-salon</code>
        </p>
        <form onSubmit={go} className="mt-6 flex gap-2">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="slug-של-העסק"
            dir="ltr"
            className="flex-1 rounded-xl border border-input px-4 py-3 text-sm"
          />
          <Button type="submit">המשך</Button>
        </form>
      </div>
    </div>
  );
}
