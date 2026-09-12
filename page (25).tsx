import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';

async function add(formData: FormData) {
  'use server';
  const { supabase } = await requireAdmin();
  const nameEn = String(formData.get('name_en') || '').trim();
  if (!nameEn) throw new Error('Category name is required.');
  const { error } = await supabase.from('categories').insert({ name_en: nameEn, name_as: String(formData.get('name_as') || '').trim() || null, description: String(formData.get('description') || '').trim() || null });
  if (error) throw new Error('Unable to create category.');
  revalidatePath('/admin/categories'); revalidatePath('/');
}
async function update(id: string, formData: FormData) {
  'use server';
  const { supabase } = await requireAdmin();
  const nameEn = String(formData.get('name_en') || '').trim();
  if (!nameEn) throw new Error('Category name is required.');
  const { error } = await supabase.from('categories').update({ name_en: nameEn, name_as: String(formData.get('name_as') || '').trim() || null, description: String(formData.get('description') || '').trim() || null }).eq('id', id);
  if (error) throw new Error('Unable to update category.');
  revalidatePath('/admin/categories'); revalidatePath('/'); revalidatePath('/notes');
}
async function remove(formData: FormData) {
  'use server';
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id') || '');
  if (!id) throw new Error('Invalid category.');
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error('Unable to delete category.');
  revalidatePath('/admin/categories'); revalidatePath('/');
}

export default async function Categories() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from('categories').select('id,name_en,name_as,description').order('name_en');
  if (error) throw new Error('Unable to load categories.');
  return <div><h1>Categories</h1><div className="grid grid-2">
    <form action={add} className="card form"><h2>Add category</h2><div className="field"><label htmlFor="name_en">Name (English)</label><input id="name_en" className="input" name="name_en" required /></div><div className="field"><label htmlFor="name_as">Name (Assamese)</label><input id="name_as" className="input" name="name_as" /></div><div className="field"><label htmlFor="description">Description</label><textarea id="description" className="textarea" name="description" rows={3} /></div><button className="btn btn-primary">Create</button></form>
    <div className="list">{data.map(c => <form action={update.bind(null, c.id)} className="card form" key={c.id}><div className="field"><label>Name (English)</label><input className="input" name="name_en" defaultValue={c.name_en} required /></div><div className="field"><label>Name (Assamese)</label><input className="input" name="name_as" defaultValue={c.name_as || ''} /></div><div className="field"><label>Description</label><textarea className="textarea" name="description" rows={2} defaultValue={c.description || ''} /></div><div className="actions"><button className="btn btn-primary">Save</button><button className="btn btn-danger" formAction={remove} name="id" value={c.id}>Delete</button></div></form>)}</div>
  </div></div>;
}
