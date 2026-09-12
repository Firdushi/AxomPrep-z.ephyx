import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';

async function create(formData: FormData) {
  'use server';
  const { supabase } = await requireAdmin();
  const title = String(formData.get('title_en') || '').trim();
  const duration = Number(formData.get('duration_minutes'));
  if (!title || !Number.isInteger(duration) || duration < 1 || duration > 600) throw new Error('Invalid test details.');
  const selected = formData.getAll('question_id').map(String);
  const positions = selected.map((questionId, fallback) => ({ question_id: questionId, position: Number(formData.get(`position_${questionId}`)) || fallback })).sort((a, b) => a.position - b.position);
  const { data: test, error } = await supabase.from('tests').insert({ title_en: title, title_as: String(formData.get('title_as') || '').trim() || null, description_en: String(formData.get('description_en') || '').trim() || null, description_as: String(formData.get('description_as') || '').trim() || null, duration_minutes: duration, published: formData.get('published') === 'on' }).select('id').single();
  if (error || !test) throw new Error('Unable to create test.');
  if (positions.length) {
    const { error: qError } = await supabase.from('test_questions').insert(positions.map(row => ({ test_id: test.id, ...row })));
    if (qError) { await supabase.from('tests').delete().eq('id', test.id); throw new Error('Unable to attach test questions.'); }
  }
  revalidatePath('/tests'); revalidatePath('/admin/tests');
  redirect('/admin/tests');
}

export default async function NewTest() {
  const { supabase } = await requireAdmin();
  const { data: questions, error } = await supabase.from('questions').select('id,question_en,difficulty').order('created_at', { ascending: false }).limit(500);
  if (error) throw new Error('Unable to load questions.');
  return <div><h1>New test</h1><form action={create} className="form card">
    <div className="field"><label htmlFor="title_en">Title (English)</label><input id="title_en" className="input" name="title_en" required /></div>
    <div className="field"><label htmlFor="title_as">Title (Assamese)</label><input id="title_as" className="input" name="title_as" /></div>
    <div className="field"><label htmlFor="description_en">Description</label><textarea id="description_en" className="textarea" name="description_en" rows={3} /></div>
    <div className="field"><label htmlFor="duration_minutes">Duration (minutes)</label><input id="duration_minutes" className="input" type="number" min="1" max="600" name="duration_minutes" defaultValue="30" required /></div>
    <div className="field"><strong>Select and order questions</strong><small className="muted">Tick questions to include them. Position 0 is first, 1 is second, and so on.</small>{questions.length ? <div className="question-picker">{questions.map((q, index) => <div className="question-pick" key={q.id}><label><input type="checkbox" name="question_id" value={q.id} /> <span>{q.question_en}</span></label><input className="input position-input" type="number" min="0" name={`position_${q.id}`} defaultValue={index} aria-label={`Position for ${q.question_en}`} /><span className="pill">{q.difficulty}</span></div>)}</div> : <div className="notice">Create MCQs before creating a test.</div>}</div>
    <label className="checkbox"><input type="checkbox" name="published" /> Publish immediately</label><button className="btn btn-primary">Create test</button>
  </form></div>;
}
