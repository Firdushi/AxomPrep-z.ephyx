import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import EmptyState from '@/components/EmptyState';

export const metadata = { title: 'Search | AxomPrep' };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const q = (params.q || '').trim();
  const supabase = await createClient();
  if (!q) return <div className="container page"><div className="page-header"><h1>Search AxomPrep</h1><p className="muted">Search notes, categories, mock tests and current affairs.</p></div><form className="searchbar"><input className="input" name="q" placeholder="Search…" autoFocus /><button className="btn btn-primary">Search</button></form></div>;

  const pattern = `%${q}%`;
  const [{ data: notes }, { data: categories }, { data: tests }, { data: affairs }] = await Promise.all([
    supabase.from('notes').select('id,slug,title_en,excerpt_en').eq('published', true).or(`title_en.ilike.${pattern},title_as.ilike.${pattern},excerpt_en.ilike.${pattern}`).limit(8),
    supabase.from('categories').select('id,name_en,name_as,description').or(`name_en.ilike.${pattern},name_as.ilike.${pattern},description.ilike.${pattern}`).limit(8),
    supabase.from('tests').select('id,title_en,description_en,duration_minutes').eq('published', true).or(`title_en.ilike.${pattern},title_as.ilike.${pattern},description_en.ilike.${pattern}`).limit(8),
    supabase.from('current_affairs').select('id,title,summary,category,date').eq('published', true).or(`title.ilike.${pattern},summary.ilike.${pattern},category.ilike.${pattern}`).limit(8),
  ]);
  const hasResults = Boolean(notes?.length || categories?.length || tests?.length || affairs?.length);
  return <div className="container page">
    <div className="page-header"><h1>Search results</h1><p className="muted">Results for “{q}”.</p></div>
    <form className="searchbar"><input className="input" name="q" defaultValue={q} aria-label="Search AxomPrep"/><button className="btn btn-primary">Search</button></form>
    {!hasResults && <div style={{ marginTop: 24 }}><EmptyState title="No results found" text="Try another keyword or a broader topic." /></div>}
    {Boolean(notes?.length) && <section className="section"><div className="section-head"><h2>Notes</h2><Link href={`/notes?q=${encodeURIComponent(q)}`}>View all</Link></div><div className="grid grid-3">{notes?.map(n => <Link className="card" href={`/notes/${n.slug}`} key={n.id}><h3>{n.title_en}</h3><p className="muted">{n.excerpt_en}</p></Link>)}</div></section>}
    {Boolean(categories?.length) && <section className="section"><div className="section-head"><h2>Categories</h2></div><div className="grid grid-3">{categories?.map(c => <Link className="card" href={`/notes?category=${c.id}`} key={c.id}><h3>{c.name_en}</h3><p className="muted">{c.name_as || c.description}</p></Link>)}</div></section>}
    {Boolean(tests?.length) && <section className="section"><div className="section-head"><h2>Mock tests</h2><Link href="/tests">View all</Link></div><div className="grid grid-3">{tests?.map(t => <Link className="card" href={`/tests/${t.id}`} key={t.id}><span className="pill">{t.duration_minutes} min</span><h3>{t.title_en}</h3><p className="muted">{t.description_en}</p></Link>)}</div></section>}
    {Boolean(affairs?.length) && <section className="section"><div className="section-head"><h2>Current affairs</h2><Link href="/current-affairs">View all</Link></div><div className="list">{affairs?.map(a => <article className="card" key={a.id}><span className="pill">{a.category || 'General'}</span><h3>{a.title}</h3><p className="muted">{a.summary}</p></article>)}</div></section>}
  </div>;
}
