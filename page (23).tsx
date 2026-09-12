import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/utils';

async function createNote(formData: FormData) {
  'use server';
  const { supabase } = await requireAdmin();
  const titleEn = String(formData.get('title_en') || '').trim();
  if (!titleEn) throw new Error('English title is required.');
  const slugInput = String(formData.get('slug') || '').trim();
  const slug = slugify(slugInput || titleEn);
  if (!slug) throw new Error('A valid slug is required.');

  const pdf = formData.get('pdf');
  let pdfPath: string | null = null;
  if (pdf instanceof File && pdf.size > 0) {
    if (pdf.type !== 'application/pdf') throw new Error('Only PDF files are allowed.');
    if (pdf.size > 20 * 1024 * 1024) throw new Error('PDF must be 20 MB or smaller.');
    const safeName = pdf.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
    pdfPath = `notes/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from('notes-pdfs').upload(pdfPath, pdf, { contentType: 'application/pdf', upsert: false });
    if (uploadError) throw new Error(`PDF upload failed: ${uploadError.message}`);
  }

  const payload = {
    title_en: titleEn,
    title_as: String(formData.get('title_as') || '').trim() || null,
    excerpt_en: String(formData.get('excerpt_en') || '').trim() || null,
    excerpt_as: String(formData.get('excerpt_as') || '').trim() || null,
    content_en: String(formData.get('content_en') || '').trim(),
    content_as: String(formData.get('content_as') || '').trim() || null,
    category_id: String(formData.get('category_id') || '').trim() || null,
    slug,
    published: formData.get('published') === 'on',
    pdf_path: pdfPath,
  };
  if (!payload.content_en) throw new Error('English content is required.');
  const { error } = await supabase.from('notes').insert(payload);
  if (error) {
    if (pdfPath) await supabase.storage.from('notes-pdfs').remove([pdfPath]);
    throw new Error(error.message);
  }
  revalidatePath('/notes');
  revalidatePath('/');
  redirect('/admin/notes');
}

export default async function NewNote() {
  const { supabase } = await requireAdmin();
  const { data: cats, error } = await supabase.from('categories').select('id,name_en').order('name_en');
  if (error) throw new Error('Unable to load categories.');
  return <div>
    <h1>New note</h1>
    <form action={createNote} className="form card" encType="multipart/form-data">
      <div className="field"><label htmlFor="title_en">English title</label><input id="title_en" className="input" name="title_en" required /></div>
      <div className="field"><label htmlFor="title_as">Assamese title</label><input id="title_as" className="input" name="title_as" /></div>
      <div className="field"><label htmlFor="slug">Slug</label><input id="slug" className="input" name="slug" placeholder="auto-generated if blank" /></div>
      <div className="field"><label htmlFor="excerpt_en">English excerpt</label><textarea id="excerpt_en" className="textarea" name="excerpt_en" rows={3} /></div>
      <div className="field"><label htmlFor="excerpt_as">Assamese excerpt</label><textarea id="excerpt_as" className="textarea" name="excerpt_as" rows={3} /></div>
      <div className="field"><label htmlFor="content_en">English content</label><textarea id="content_en" className="textarea" name="content_en" rows={10} required /></div>
      <div className="field"><label htmlFor="content_as">Assamese content</label><textarea id="content_as" className="textarea" name="content_as" rows={10} /></div>
      <div className="field"><label htmlFor="category_id">Category</label><select id="category_id" className="select" name="category_id"><option value="">No category</option>{cats.map(c => <option value={c.id} key={c.id}>{c.name_en}</option>)}</select></div>
      <div className="field"><label htmlFor="pdf">Private PDF attachment</label><input id="pdf" className="input" name="pdf" type="file" accept="application/pdf,.pdf" /><small className="muted">Optional. Maximum 20 MB.</small></div>
      <label className="checkbox"><input type="checkbox" name="published" /> Publish immediately</label>
      <button className="btn btn-primary" type="submit">Create note</button>
    </form>
  </div>;
}
