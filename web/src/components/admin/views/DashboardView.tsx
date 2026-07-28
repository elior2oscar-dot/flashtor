'use client';

type DashboardViewProps = {
  stats: { businesses: number; appointments: number; waitlist: number } | null;
  loadError: string;
};

export function DashboardView({ stats, loadError }: DashboardViewProps) {
  return (
    <div>
      {loadError ? <p className="mb-4 text-sm text-red-400">{loadError}</p> : null}
      {stats ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Clients" value={stats.businesses} />
          <StatCard label="Appointments (total)" value={stats.appointments} />
          <StatCard label="Waitlist entries" value={stats.waitlist} />
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Loading metrics…</p>
      )}
      <p className="mt-8 max-w-xl text-sm text-zinc-500">
        Use <strong className="text-zinc-300">Clients</strong> to create slugs, set subscriptions, and open owner portals. Use{' '}
        <strong className="text-zinc-300">Team access</strong> to create or link owner logins.
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
