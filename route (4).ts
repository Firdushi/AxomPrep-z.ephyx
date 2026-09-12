import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  const form = await request.formData();
  const noteId = String(form.get('note_id') || '');
  if (!/^[0-9a-f-]{36}$/i.test(noteId)) return NextResponse.json({ error: 'Invalid note id.' }, { status: 400 });
  const { data: note, error: noteError } = await supabase.from('notes').select('id,slug').eq('id', noteId).eq('published', true).maybeSingle();
  if (noteError || !note) return NextResponse.json({ error: 'Note not found.' }, { status: 404 });
  const { data: existing } = await supabase.from('bookmarks').select('id').eq('user_id', user.id).eq('note_id', noteId).maybeSingle();
  if (existing) {
    await supabase.from('bookmarks').delete().eq('id', existing.id).eq('user_id', user.id);
  } else {
    const { error } = await supabase.from('bookmarks').insert({ user_id: user.id, note_id: noteId });
    if (error) return NextResponse.json({ error: 'Unable to save bookmark.' }, { status: 500 });
  }
  revalidatePath(`/notes/${note.slug}`);
  revalidatePath('/dashboard');
  return NextResponse.redirect(new URL(`/notes/${note.slug}`, request.url), 303);
}
