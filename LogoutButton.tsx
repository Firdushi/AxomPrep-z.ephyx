'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
export default function LogoutButton(){const [busy,setBusy]=useState(false);const router=useRouter();async function logout(){setBusy(true);const {error}=await createClient().auth.signOut();if(!error)router.push('/');else setBusy(false)}return <button className="btn btn-secondary" onClick={logout} disabled={busy}>{busy?'Signing out…':'Logout'}</button>}
