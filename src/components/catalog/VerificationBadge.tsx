const LABELS: Record<string, string> = {
  verified: 'Verified',
  needs_review: 'Needs review',
  expired: 'Expired',
  estimated: 'Estimated',
};

const CLASSES: Record<string, string> = {
  verified: 'badge badge-verified',
  needs_review: 'badge badge-review',
  expired: 'badge badge-expired',
  estimated: 'badge badge-estimated',
};

export function VerificationBadge({ status }: { status?: string | null }) {
  const key = status ?? 'needs_review';
  return (
    <span className={CLASSES[key] ?? 'badge'}>
      {LABELS[key] ?? key}
    </span>
  );
}

export function LastVerified({ date }: { date?: Date | string | null }) {
  if (!date) return <span className="muted">Last verified: not yet verified</span>;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) {
    return <span className="muted">Last verified: not yet verified</span>;
  }
  return (
    <span className="muted">
      Last verified: {d.toISOString().slice(0, 10)}
    </span>
  );
}
