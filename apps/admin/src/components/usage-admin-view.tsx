'use client';

import { useMemo, useState } from 'react';
import { formatNaira, parseNairaInput } from '@askalert/payments';
import { getPlanById } from '@askalert/core';
import { Button, Input } from '@askalert/ui';
import { findPlanLabel, useBillingAdmin } from '../lib/billing-admin-store';
import { useAdminStore } from '../lib/admin-store';
import { canGrantCredits } from '../lib/roles';

export function UsageAdminView() {
  const { role } = useAdminStore();
  const { users, events, plans, grantCredit, auditLog } = useBillingAdmin();
  const canGrant = canGrantCredits(role);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(users[0]?.userId ?? '');
  const [creditNaira, setCreditNaira] = useState('100');
  const [creditReason, setCreditReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const selected = users.find((user) => user.userId === selectedId) ?? users[0];
  const filteredUsers = users.filter((user) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return true;
    }
    return (
      user.displayName.toLowerCase().includes(q) ||
      user.userId.toLowerCase().includes(q)
    );
  });

  const userEvents = useMemo(() => {
    if (!selected) {
      return [];
    }
    return events
      .filter((event) => event.userId === selected.userId)
      .filter((event) => (typeFilter === 'all' ? true : event.type === typeFilter))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [events, selected, typeFilter]);

  const costToDate = userEvents.reduce((sum, event) => sum + event.estCostMinor, 0);
  const catalogue = selected ? getPlanById(selected.planId) : null;

  const onGrant = () => {
    if (!selected) {
      return;
    }
    if (!canGrant) {
      setMessage('Only Super admin or Operations can grant credit.');
      return;
    }
    const amountMinor = parseNairaInput(creditNaira);
    if (amountMinor === null || amountMinor <= 0) {
      setMessage('Enter a valid credit amount in Naira.');
      return;
    }
    const result = grantCredit({
      userId: selected.userId,
      amountMinor,
      reason: creditReason,
      actorRole: role,
    });
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setCreditReason('');
    setMessage('Credit granted and written to audit_log.');
  };

  if (!selected) {
    return <p className="text-sm text-muted-foreground">No mock users.</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">Billing</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Usage</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Search a user, review allowances and cost, grant a one-off credit with a reason.
        </p>
      </div>

      {message ? (
        <p className="rounded-2xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm font-medium text-navy-950">
          {message}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
        <Input
          label="Search user"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name or id"
        />
        <label className="block text-sm">
          <span className="mb-1.5 block font-semibold text-foreground">Event type</span>
          <select
            className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="ai_suggestion">AI</option>
            <option value="wa_service">WhatsApp</option>
            <option value="sms">SMS</option>
            <option value="stt">Speech</option>
            <option value="places">Maps</option>
            <option value="request">Request</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <ul className="space-y-2">
          {filteredUsers.map((user) => (
            <li key={user.userId}>
              <button
                type="button"
                className={`w-full rounded-2xl border px-3 py-3 text-left text-sm ${
                  user.userId === selected.userId
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-border bg-card'
                }`}
                onClick={() => {
                  setSelectedId(user.userId);
                  setMessage(null);
                }}
              >
                <p className="font-extrabold">{user.displayName}</p>
                <p className="text-xs text-muted-foreground">{user.userId}</p>
              </button>
            </li>
          ))}
        </ul>

        <div className="space-y-4">
          <section className="rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-sm">
            <h2 className="text-sm font-bold">{selected.displayName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {findPlanLabel(plans, selected.planId)} · subscribed v{selected.planVersion}
            </p>
            <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <li>
                Requests used: {selected.usage.requests}
                {catalogue?.limits.requestsPerMonth != null
                  ? ` / ${catalogue.limits.requestsPerMonth}`
                  : ''}
              </li>
              <li>Chat used: {selected.usage.relayedMessages}</li>
              <li>AI used: {selected.usage.aiSuggestions}</li>
              <li>
                Lead alerts: {selected.usage.leadAlerts}
                {selected.bonusLeadAlerts
                  ? ` (+${selected.bonusLeadAlerts} bonus)`
                  : ''}
              </li>
              <li>
                Wallet:{' '}
                {formatNaira({ amountKobo: selected.walletBalanceMinor, currency: 'NGN' })}
              </li>
              <li>
                Cost to date:{' '}
                {formatNaira({ amountKobo: costToDate, currency: 'NGN' })}
              </li>
            </ul>
          </section>

          <section className="rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-sm">
            <h2 className="text-sm font-bold">Grant one-off credit</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input
                label="Amount (₦)"
                inputMode="decimal"
                value={creditNaira}
                disabled={!canGrant}
                onChange={(event) => setCreditNaira(event.target.value)}
                hint="Enter Naira. Example: 100 for ₦100."
              />
              <Input
                label="Reason (required)"
                value={creditReason}
                disabled={!canGrant}
                onChange={(event) => setCreditReason(event.target.value)}
              />
            </div>
            <Button
              type="button"
              className="mt-4 min-h-11"
              disabled={!canGrant}
              onClick={onGrant}
            >
              Grant credit
            </Button>
          </section>

          <section className="overflow-x-auto rounded-[1.5rem] border border-border/70 bg-card shadow-sm">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="bg-card-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Units</th>
                  <th className="px-3 py-2">Cost</th>
                </tr>
              </thead>
              <tbody>
                {userEvents.map((event) => (
                  <tr key={event.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      {new Date(event.createdAt).toLocaleString('en-NG')}
                    </td>
                    <td className="px-3 py-2">{event.type}</td>
                    <td className="px-3 py-2">{event.units}</td>
                    <td className="px-3 py-2">
                      {formatNaira({ amountKobo: event.estCostMinor, currency: 'NGN' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {auditLog.length ? (
            <section className="rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-sm">
              <h2 className="text-sm font-bold">Recent audit</h2>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {auditLog.slice(0, 5).map((entry) => (
                  <li key={entry.id}>
                    {entry.action} · {entry.reason} · {entry.actorRole}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
