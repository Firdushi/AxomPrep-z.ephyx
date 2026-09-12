export function cn(...values: Array<string | false | null | undefined>) { return values.filter(Boolean).join(' '); }
export function formatDate(value: string | Date | null) { return value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value)) : '—'; }
export function formatPercent(score: number, total: number) { return total ? Math.round((score / total) * 100) : 0; }
export function slugify(input: string) { return input.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'); }
export function safeNextPath(value: string | null | undefined, fallback = '/dashboard') {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
}
