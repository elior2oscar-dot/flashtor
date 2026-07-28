'use client';

import { Pencil, Trash2, UserPlus } from 'lucide-react';

import { AdminPageHeader } from '@/components/admin/AdminShell';
import type { MemberRow } from '@/components/admin/types';
import { Button } from '@/components/ui/button';

type TeamViewProps = {
  members: MemberRow[];
  onCreateAccount: () => void;
  onAttach: () => void;
  onEdit: (m: MemberRow) => void;
  onRemove: (m: MemberRow) => void;
};

export function TeamView({ members, onCreateAccount, onAttach, onEdit, onRemove }: TeamViewProps) {
  return (
    <div>
      <AdminPageHeader
        title="Team access"
        description="Owner and manager logins per client (mobile app and owner portal)."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onAttach} className="gap-2">
              <UserPlus className="size-4" />
              Link existing user
            </Button>
            <Button type="button" onClick={onCreateAccount} className="gap-2">
              <UserPlus className="size-4" />
              Create account
            </Button>
          </div>
        }
      />
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[640px] text-start text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">User id</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No team members yet. Create or link an owner for a client.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={`${m.user_id}-${m.business_id}`} className="border-t border-zinc-800">
                  <td className="px-4 py-3">{m.businesses?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{m.businesses?.slug ?? '—'}</td>
                  <td className="max-w-[12rem] truncate px-4 py-3 font-mono text-xs text-zinc-400" title={m.user_id}>
                    {m.user_id}
                  </td>
                  <td className="px-4 py-3 capitalize">{m.role}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs text-zinc-300 underline"
                        onClick={() => onEdit(m)}
                      >
                        <Pencil className="size-3" />
                        Edit role
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs text-red-400 underline"
                        onClick={() => onRemove(m)}
                      >
                        <Trash2 className="size-3" />
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-zinc-500">
        Emails are stored in Supabase Auth only. Use the user id here to match Authentication → Users if needed.
      </p>
    </div>
  );
}
