import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { formatDate, formatPercent } from '@/lib/utils';

type TestInfo = { title_en: string } | null;
type Attempt = { id: string; test_id: string; user_id: string; score: number; total: number; submitted_at: string | null; tests: TestInfo };

export default async function Result({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ attempt?: string }> }) {
  const { id } = await params;
  const p = await searchParams;
  if (!p.attempt) redirect(`/tests/${id}`);
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from('attempts').select('id,test_id,user_id,score,total,submitted_at,tests(title_en)').eq('id', p.attempt).eq('test_id', id).maybeSingle();
  if (error || !data) notFound();
  const attempt = data as unknown as Attempt;
  if (attempt.user_id !== user.id) {
    const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profileError || profile?.role !== 'admin') notFound();
  }
  if (!attempt.submitted_at) redirect(`/tests/${id}`);
  return <div className="container page"><div className="card" style={{ maxWidth: 680, margin: 'auto', textAlign: 'center' }}><span className="pill">Result</span><h1>{attempt.tests?.title_en || 'Test'}</h1><div className="hero-card"><div className="big">{attempt.score}/{attempt.total}</div><h2>{formatPercent(attempt.score, attempt.total)}%</h2><p>Correct: {attempt.score} · Incorrect: {attempt.total - attempt.score}</p></div><p className="muted">Attempted {formatDate(attempt.submitted_at)}</p><div className="actions" style={{ justifyContent: 'center' }}><Link className="btn btn-primary" href="/tests">More tests</Link><Link className="btn btn-secondary" href="/dashboard">Dashboard</Link></div></div></div>;
}
