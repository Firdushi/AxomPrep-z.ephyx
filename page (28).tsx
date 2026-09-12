import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';

async function update(id: string, formData: FormData) {
  'use server';
  const { supabase } = await requireAdmin();
  const duration = Number(formData.get('duration_minutes'));
  const title = String(formData.get('title_en') || '').trim();
  if (!title || !Number.isInteger(duration) || duration < 1 || duration > 600) throw new Error('Invalid test details.');
  const selected = formData.getAll('question_id').map(String);
  const positions = selected.map((questionId, fallback) => ({ question_id: questionId, position: Number(formData.get(`position_${questionId}`)) || fallback })).sort((a, b) => a.position - b.position);
  const { error } = await supabase.from('tests').update({ title_en: title, title_as: String(formData.get('title_as') || '').trim() || null, description_en: String(formData.get('description_en') || '').trim() || null, description_as: String(formData.get('description_as') || '').trim() || null, duration_minutes: duration, published: formData.get('published') === 'on' }).eq('id', id);
  if (error) throw new Error('Unable to update test.');
  const { error: deleteError } = await supabase.from('test_questions').delete().eq('test_id', id);
  if (deleteError) throw new Error('Unable to update test questions.');
  if (positions.length) {
    const { error: insertError } = await supabase.from('test_questions').insert(positions.map(row => ({ test_id: id, ...row })));
    if (insertError) throw new Error('Unable to update test questions.');
  }
  revalidatePath('/tests'); revalidatePath('/admin/tests');
  redirect('/admin/tests');
}

export default async function EditTest({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: test, error: testError }, { data: links, error: linkError }, { data: questions, error: questionError }] = await Promise.all([
    supabase.from('tests').select('*').eq('id', id).maybeSingle(),
    supabase.from('test_questions').select('question_id,position').eq('test_id', id).order('position'),
    supabase.from('questions').select('id,question_en,difficulty').order('created_at', { ascending: false }).limit(500),
  ]);
  if (testError || linkError || questionError) throw new Error('Unable to load test.');
  if (!test) notFound();
  const selected = new Map((links ?? []).map(row => [row.question_id, row.position]));
  return <div><h1>Edit test</h1><form action={update.bind(null, id)} className="form card">
    <div className="field"><label htmlFor="title_en">Title (English)</label><input id="title_en" className="input" name="title_en" defaultValue={test.title_en} required /></div>
    <div className="field"><label htmlFor="title_as">Title (Assamese)</label><input id="title_as" className="input" name="title_as" defaultValue={test.title_as || ''} /></div>
    <div className="field"><label htmlFor="description_en">Description</label><textarea id="description_en" className="textarea" name="description_en" rows={3} defaultValue={test.description_en || ''} /></div>
    <div className="field"><label htmlFor="duration_minutes">Duration (minutes)</label><input id="duration_minutes" className="input" type="number" min="1" max="600" name="duration_minutes" defaultValue={test.duration_minutes} required /></div>
    <div className="field"><strong>Select and order questions</strong><small className="muted">Tick questions to include them. Lower position numbers appear first.</small><div className="question-picker">{questions.map((q, index) => <div className="question-pick" key={q.id}><label><input type="checkbox" name="question_id" value={q.id} defaultChecked={selected.has(q.id)} /> <span>{q.question_en}</span></label><input className="input position-input" type="number" min="0" name={`position_${q.id}`} defaultValue={selected.get(q.id) ?? index} aria-label={`Position for ${q.question_en}`} /><span className="pill">{q.difficulty}</span></div>)}</div></div>
    <label className="checkbox"><input type="checkbox" name="published" defaultChecked={test.published} /> Published</label><button className="btn btn-primary">Save changes</button>
  </form></div>;
}
