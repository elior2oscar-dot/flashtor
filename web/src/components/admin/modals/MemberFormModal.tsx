'use client';

import { useEffect, useState } from 'react';

import { Field, Modal, inputClassName, selectClassName } from '@/components/admin/Modal';
import type { BusinessRow } from '@/components/admin/types';
import { Button } from '@/components/ui/button';

export type MemberFormMode = 'create' | 'attach' | 'edit' | 'remove';

export type MemberFormSubmit =
  | { mode: 'create'; email: string; password: string; fullName: string; businessId: string; role: 'owner' | 'manager' }
  | { mode: 'attach'; email: string; fullName: string; businessId: string; role: 'owner' | 'manager' }
  | { mode: 'edit'; role: 'owner' | 'manager' }
  | { mode: 'remove' };

type MemberFormModalProps = {
  open: boolean;
  mode: MemberFormMode;
  businesses: BusinessRow[];
  defaultBusinessId?: string;
  memberLabel?: string;
  memberRole?: 'owner' | 'manager';
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (payload: MemberFormSubmit) => void;
};

export function MemberFormModal({
  open,
  mode,
  businesses,
  defaultBusinessId,
  memberLabel,
  memberRole,
  saving,
  error,
  onClose,
  onSubmit,
}: MemberFormModalProps) {
  const [businessId, setBusinessId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'owner' | 'manager'>('owner');

  useEffect(() => {
    if (!open) return;
    setBusinessId(defaultBusinessId ?? businesses[0]?.id ?? '');
    setEmail(mode === 'create' || mode === 'attach' ? '' : '');
    setPassword('');
    setFullName('');
    setRole(memberRole ?? 'owner');
  }, [open, defaultBusinessId, businesses, memberRole, mode]);

  const titles: Record<MemberFormMode, string> = {
    create: 'Create owner account',
    attach: 'Link existing user',
    edit: 'Edit team member',
    remove: 'Remove access',
  };

  const descriptions: Record<MemberFormMode, string> = {
    create: 'Creates a Supabase Auth user and grants access to the selected business.',
    attach: 'Finds an existing Auth user by email and adds them to the business.',
    edit: 'Update role for this membership.',
    remove: 'They will lose portal and mobile access for this business.',
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'remove') {
      onSubmit({ mode: 'remove' });
      return;
    }
    if (mode === 'edit') {
      onSubmit({ mode: 'edit', role });
      return;
    }
    if (mode === 'create') {
      onSubmit({ mode: 'create', email, password, fullName, businessId, role });
      return;
    }
    onSubmit({ mode: 'attach', email, fullName, businessId, role });
  }

  return (
    <Modal
      open={open}
      title={titles[mode]}
      description={descriptions[mode]}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="member-form"
            disabled={saving}
            variant={mode === 'remove' ? 'destructive' : 'default'}
          >
            {saving
              ? 'Working…'
              : mode === 'remove'
                ? 'Remove access'
                : mode === 'create'
                  ? 'Create & link'
                  : mode === 'attach'
                    ? 'Link user'
                    : 'Save role'}
          </Button>
        </div>
      }
    >
      <form id="member-form" className="space-y-4" onSubmit={handleSubmit}>
        {mode !== 'edit' && mode !== 'remove' ? (
          <Field label="Client (business)">
            <select
              className={selectClassName}
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              required
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.slug ? `(${b.slug})` : ''}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        {mode === 'remove' ? (
          <p className="text-sm text-zinc-300">
            Remove <strong>{memberLabel ?? 'this user'}</strong> from the selected business?
          </p>
        ) : null}

        {mode !== 'edit' && mode !== 'remove' ? (
          <>
            <Field label="Email">
              <input
                type="email"
                className={inputClassName}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            {mode === 'create' ? (
              <Field label="Temporary password" hint="At least 6 characters. Owner can change later.">
                <input
                  type="password"
                  className={inputClassName}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </Field>
            ) : null}
            <Field label="Contact full name (optional)">
              <input className={inputClassName} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Field>
          </>
        ) : null}

        {mode !== 'remove' ? (
          <Field label="Role">
            <select className={selectClassName} value={role} onChange={(e) => setRole(e.target.value as 'owner' | 'manager')}>
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
            </select>
          </Field>
        ) : null}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </form>
    </Modal>
  );
}
