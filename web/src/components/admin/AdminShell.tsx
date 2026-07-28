'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Building2, LayoutDashboard, LogOut, Users } from 'lucide-react';

import type { AdminNav } from '@/components/admin/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV: { id: AdminNav; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Building2 },
  { id: 'team', label: 'Team access', icon: Users },
];

type AdminShellProps = {
  email: string | undefined;
  active: AdminNav;
  onNavigate: (nav: AdminNav) => void;
  onSignOut: () => void;
  children: ReactNode;
};

export function AdminShell({ email, active, onNavigate, onSignOut, children }: AdminShellProps) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="flex w-56 shrink-0 flex-col border-e border-zinc-800 bg-zinc-900/80">
        <div className="border-b border-zinc-800 px-4 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">FlashTor</p>
          <p className="text-sm font-bold">Platform admin</p>
          <p className="mt-1 truncate text-xs text-zinc-500">{email}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors',
                active === id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
        <div className="border-t border-zinc-800 p-3">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={onSignOut}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 lg:hidden">
          <span className="font-semibold">Platform admin</span>
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            <LogOut className="size-4" />
          </Button>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export function AdminPageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function ExternalPortalLink({ slug }: { slug: string }) {
  return (
    <Link href={`/portal/${slug}`} className="text-sky-400 underline-offset-2 hover:underline">
      Owner portal
    </Link>
  );
}
