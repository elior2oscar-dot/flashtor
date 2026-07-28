'use client';

import { useState } from 'react';
import { Copy, ExternalLink, Pencil, Plus, UserPlus } from 'lucide-react';

import { AdminPageHeader, ExternalPortalLink } from '@/components/admin/AdminShell';
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
  bookingUrl,
  type BusinessRow,
} from '@/components/admin/types';
import { Button } from '@/components/ui/button';

function planLabel(value: string) {
  return SUBSCRIPTION_PLANS.find((p) => p.value === value)?.label ?? value;
}

function statusLabel(value: string) {
  return SUBSCRIPTION_STATUSES.find((s) => s.value === value)?.label ?? value;
}

type ClientsViewProps = {
  businesses: BusinessRow[];
  onCreate: () => void;
  onEdit: (b: BusinessRow) => void;
  onAddMember: (b: BusinessRow) => void;
  onToggleActive: (b: BusinessRow) => void;
  onPrepareBooking: (b: BusinessRow) => void;
};

export function ClientsView({
  businesses,
  onCreate,
  onEdit,
  onAddMember,
  onToggleActive,
  onPrepareBooking,
}: ClientsViewProps) {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  async function copyLink(slug: string) {
    const url = bookingUrl(slug);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Clients"
        description="Each row is a business with its booking slug and subscription."
        actions={
          <Button type="button" onClick={onCreate} className="gap-2">
            <Plus className="size-4" />
            New client
          </Button>
        }
      />
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[800px] text-start text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Business name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Booking link</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {businesses.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  No clients yet. Create one to get a slug and booking link.
                </td>
              </tr>
            ) : (
              businesses.map((b) => (
                <tr key={b.id} className="border-t border-zinc-800">
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{b.slug ?? '—'}</td>
                  <td className="px-4 py-3">{planLabel(b.subscription_plan ?? 'trial')}</td>
                  <td className="px-4 py-3">{statusLabel(b.subscription_status ?? 'active')}</td>
                  <td className="px-4 py-3">{b.phone}</td>
                  <td className="max-w-[220px] px-4 py-3">
                    {b.slug ? (
                      <div className="flex flex-col gap-1">
                        <span className="truncate font-mono text-[11px] text-zinc-400" title={bookingUrl(b.slug)}>
                          {bookingUrl(b.slug)}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs text-emerald-400 underline"
                            onClick={() => void copyLink(b.slug!)}
                          >
                            <Copy className="size-3" />
                            {copiedSlug === b.slug ? 'Copied' : 'Copy'}
                          </button>
                          <a
                            href={bookingUrl(b.slug)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-sky-400 underline"
                          >
                            <ExternalLink className="size-3" />
                            Open
                          </a>
                          <button
                            type="button"
                            className="text-xs text-zinc-500 underline"
                            onClick={() => onPrepareBooking(b)}
                          >
                            Refresh slots
                          </button>
                        </div>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">{b.is_active ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs text-zinc-300 underline"
                        onClick={() => onEdit(b)}
                      >
                        <Pencil className="size-3" />
                        Edit
                      </button>
                      {b.slug ? (
                        <>
                          <ExternalPortalLink slug={b.slug} />
                        </>
                      ) : null}
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs text-sky-400 underline"
                        onClick={() => onAddMember(b)}
                      >
                        <UserPlus className="size-3" />
                        Add user
                      </button>
                      <button
                        type="button"
                        className="text-xs text-amber-400 underline"
                        onClick={() => onToggleActive(b)}
                      >
                        {b.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
