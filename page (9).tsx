import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { formatDate, formatPercent } from '@/lib/utils';
import EmptyState from '@/components/EmptyState';

type AttemptRow = { id: string; test_id: string; score: number; total: number; submitted_at: string | null; tests: { title_en: string } | null };
type BookmarkRow = { id: string; note_id: string; created_at: string; notes: { title_en: string; slug: string } | null };

export default async function Dashboard() {
  const { supabase, user } = await requireUser();
  const [{ data: profile, error: profileError }, { data: attemptsData, error: attemptsError }, { data: bookmarksData, error: bookmarksError }] = await Promise.all([
    supabase.from('profiles').select('full_name,preferred_language,role').eq('id', user.id).maybeSingle(),
    supabase.from('attempts').select('id,test_id,score,total,submitted_at,tests(title_en)').eq('user_id', user.id).not('submitted_at', 'is', null).order('submitted_at', { ascending: false }).limit(8),
    supabase.from('bookmarks').select('id,note_id,created_at,notes(title_en,slug)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(8),
  ]);
  if (profileError || attemptsError || bookmarksError) return <div className="container page"><div className="error">Unable to load your dashboard right now.</div></div>;
  const attempts = (attemptsData ?? []) as unknown as AttemptRow[];
  const bookmarks = (bookmarksData ?? []) as unknown as BookmarkRow[];
  return <div className="container page">
    <div className="page-header"><h1>Hello, {profile?.full_name || user.email}</h1><p className="muted">Your learning dashboard and recent activity.</p></div>
    <div className="stat-grid">
      <div className="card stat"><span className="muted">Recent attempts</span><strong>{attempts.length}</strong></div>
      <div className="card stat"><span className="muted">Bookmarks</span><strong>{bookmarks.length}</strong></div>
      <div className="card stat"><span className="muted">Role</span><strong style={{ fontSize: 20 }}>{profile?.role ?? 'user'}</strong></div>
      <div className="card stat"><span className="muted">Language</span><strong style={{ fontSize: 20 }}>{profile?.preferred_language ?? 'en'}</strong></div>
    </div>
    <section className="section"><div className="section-head"><div><h2>Recent attempts</h2><p className="muted">Your latest mock-test results.</p></div><Link href="/tests">Take a test</Link></div>{attempts.length ? <div className="list">{attempts.map(a => <Link className="card" key={a.id} href={`/tests/${a.test_id}/result?attempt=${a.id}`}><div className="section-head"><div><h3>{a.tests?.title_en || 'Test'}</h3><span className="muted">{a.submitted_at ? formatDate(a.submitted_at) : ''}</span></div><strong>{a.score}/{a.total} · {formatPercent(a.score, a.total)}%</strong></div></Link>)}</div> : <EmptyState title="No attempts yet" text="Take your first mock test to start building your history." />}</section>
    <section className="section"><div className="section-head"><div><h2>Bookmarks</h2><p className="muted">Saved study notes.</p></div><Link href="/notes">Browse notes</Link></div>{bookmarks.length ? <div className="grid grid-2">{bookmarks.map(b => <Link className="card" key={b.id} href={b.notes ? `/notes/${b.notes.slug}` : '/notes'}><h3>{b.notes?.title_en || 'Saved note'}</h3><span className="muted">Saved {formatDate(b.created_at)}</span></Link>)}</div> : <EmptyState title="No bookmarks yet" text="Save useful notes while studying." />}</section>
  </div>;
}
