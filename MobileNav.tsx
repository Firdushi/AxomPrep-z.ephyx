'use client';
import Link from 'next/link';
import { useState } from 'react';
import LogoutButton from './LogoutButton';

export default function MobileNav({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  return <div className="mobile-nav-wrap">
    <button className="mobile-menu-button" type="button" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(v => !v)}>{open ? 'Close' : 'Menu'}</button>
    {open && <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile navigation">
      <Link href="/notes" onClick={() => setOpen(false)}>Notes</Link>
      <Link href="/tests" onClick={() => setOpen(false)}>Mock Tests</Link>
      <Link href="/gk" onClick={() => setOpen(false)}>Assam GK</Link>
      <Link href="/current-affairs" onClick={() => setOpen(false)}>Current Affairs</Link>
      <Link href="/search" onClick={() => setOpen(false)}>Search</Link>
      <Link href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
      {signedIn ? <LogoutButton /> : <Link className="btn btn-primary" href="/login" onClick={() => setOpen(false)}>Login</Link>}
    </nav>}
  </div>;
}
