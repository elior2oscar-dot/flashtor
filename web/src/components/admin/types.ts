export const SUBSCRIPTION_PLANS = [
  { value: 'trial', label: 'Trial' },
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
] as const;

export const SUBSCRIPTION_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'past_due', label: 'Past due' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number]['value'];
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]['value'];

export type BusinessRow = {
  id: string;
  name: string;
  slug: string | null;
  phone: string;
  whatsapp_phone: string | null;
  timezone: string;
  is_active: boolean;
  subscription_plan?: SubscriptionPlan;
  subscription_status?: SubscriptionStatus;
  created_at: string;
};

export type MemberRow = {
  user_id: string;
  business_id: string;
  role: 'owner' | 'manager';
  created_at: string;
  businesses: { name: string; slug: string | null } | null;
};

export type AdminNav = 'dashboard' | 'clients' | 'team';

export function slugifyName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export { bookingPath, bookingUrl, portalPath, portalUrl } from '@/lib/paths';
