interface BadgeProps {
  label: string;
  tone?: 'primary' | 'olive' | 'brown' | 'danger' | 'neutral';
}

const TONE_CLASSES: Record<NonNullable<BadgeProps['tone']>, string> = {
  primary: 'bg-primary/10 text-primary border-primary/30',
  olive: 'bg-olive/10 text-olive border-olive/30',
  brown: 'bg-brown/10 text-brown border-brown/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
  neutral: 'bg-surface-alt text-text-secondary border-border',
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  return <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TONE_CLASSES[tone]}`}>{label}</span>;
}
