import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/utils';

async function update(id: string, formData: FormData) {
  'use server';
  const { supabase } = await requireAdmin();
  const title = String(formData.get('title_en') || '').trim();
  const slug = slugify(String(formData.get('slug') || '').trim() || title);
  if (!title || !slug) throw new Error('Title and slug are required.');
  const { data: existing, error: existingError } = await supabase.from('notes').select('pdf_path').eq('id', id).maybeSingle();
  if (existingError || !existing) throw new Error('Note not found.');

  const pdf = formData.get('pdf');
  let pdfPath = existing.pdf_path as string | null;
  if (pdf instanceof File && pdf.size > 0) {
    if (pdf.type !== 'application/pdf') throw new Error('Only PDF files are allowed.');
    if (pdf.size > 20 * 1024 * 1024) throw new Error('PDF must be 20 MB or smaller.');
    const safeName = pdf.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
    pdfPath = `notes/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from('notes-pdfs').upload(pdfPath, pdf, { contentType: 'application/pdf', upsert: false });
    if (uploadError) throw new Error(`PDF upload failed: ${uploadError.message}`);
  }

  const { error } = await supabase.from('notes').update({
    title_en: title,
    title_as: String(formData.get('title_as') || '').trim() || null,
    excerpt_en: String(formData.get('excerpt_en') || '').trim() || null,
    excerpt_as: String(formData.get('excerpt_as') || '').trim() || null,
    content_en: String(formData.get('content_en') || '').trim(),
    content_as: String(formData.get('content_as') || '').trim() || null,
    category_id: String(formData.get('category_id') || '').trim() || null,
    slug,
    published: formData.get('published') === 'on',
    pdf_path: pdfPath,
  }).eq('id', id);
  if (error) {
    if (pdfPath && pdfPath !== existing.pdf_path) await supabase.storage.from('notes-pdfs').remove([pdfPath]);
    throw new Error(error.message);
  }
  if (pdfPath && pdfPath !== existing.pdf_path && existing.pdf_path) await supabase.storage.from('notes-pdfs').remove([existing.pdf_path]);
  revalidatePath('/notes');
  revalidatePath('/');
  revalidatePath('/admin/notes');
  redirect('/admin/notes');
}

async function removePdf(id: string) {
  'use server';
  const { supabase } = await requireAdmin();
  const { data: note } = await supabase.from('notes').select('pdf_path').eq('id', id).maybeSingle();
  if (note?.pdf_path) await supabase.storage.from('notes-pdfs').remove([note.pdf_path]);
  await supabase.from('notes').update({ pdf_path: null }).eq('id', id);
  revalidatePath('/notes');
  revalidatePath('/admin/notes');
  redirect(`/admin/notes/edit/${id}`);
}

export default async function EditNote({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: note, error: noteError }, { data: cats, error: catError }] = await Promise.all([
    supabase.from('notes').select('*').eq('id', id).maybeSingle(),
    supabase.from('categories').select('id,name_en').order('name_en'),
  ]);
  if (noteError || catError) throw new Error('Unable to load note.');
  if (!note) notFound();
  return <div>
    <h1>Edit note</h1>
    <form action={update.bind(null, id)} className="form card" encType="multipart/form-data">
      <div className="field"><label htmlFor="title_en">English title</label><input id="title_en" className="input" name="title_en" defaultValue={note.title_en} required /></div>
      <div className="field"><label htmlFor="title_as">Assamese title</label><input id="title_as" className="input" name="title_as" defaultValue={note.title_as || ''} /></div>
      <div className="field"><label htmlFor="slug">Slug</label><input id="slug" className="input" name="slug" defaultValue={note.slug} required /></div>
      <div className="field"><label htmlFor="excerpt_en">English excerpt</label><textarea id="excerpt_en" className="textarea" name="excerpt_en" rows={3} defaultValue={note.excerpt_en || ''} /></div>
      <div className="field"><label htmlFor="excerpt_as">Assamese excerpt</label><textarea id="excerpt_as" className="textarea" name="excerpt_as" rows={3} defaultValue={note.excerpt_as || ''} /></div>
      <div className="field"><label htmlFor="content_en">English content</label><textarea id="content_en" className="textarea" name="content_en" rows={10} defaultValue={note.content_en} required /></div>
      <div className="field"><label htmlFor="content_as">Assamese content</label><textarea id="content_as" className="textarea" name="content_as" rows={10} defaultValue={note.content_as || ''} /></div>
      <div className="field"><label htmlFor="category_id">Category</label><select id="category_id" className="select" name="category_id" defaultValue={note.category_id || ''}><option value="">No category</option>{cats?.map(c => <option value={c.id} key={c.id}>{c.name_en}</option>)}</select></div>
      <div className="field"><label htmlFor="pdf">Replace PDF</label><input id="pdf" className="input" name="pdf" type="file" accept="application/pdf,.pdf" /><small className="muted">{note.pdf_path ? `Current: ${note.pdf_path}` : 'No PDF attached.'}</small></div>
      {note.pdf_path && <button className="btn btn-danger" formAction={removePdf.bind(null, id)} type="submit">Remove current PDF</button>}
      <label className="checkbox"><input type="checkbox" name="published" defaultChecked={note.published} /> Published</label>
      <button className="btn btn-primary" type="submit">Save changes</button>
    </form>
  </div>;
}
