import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
export async function requireUser(){const supabase=await createClient();const {data:{user},error}=await supabase.auth.getUser();if(error||!user) redirect('/login?next=/dashboard');return {supabase,user};}
export async function requireAdmin(){const {supabase,user}=await requireUser();const {data:profile,error}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle();if(error||profile?.role!=='admin') redirect('/dashboard');return {supabase,user,profile};}
export async function getCurrentUser(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();return {supabase,user};}
