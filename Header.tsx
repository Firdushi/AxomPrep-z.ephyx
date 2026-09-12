import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import LogoutButton from './LogoutButton';
import MobileNav from './MobileNav';

export default async function Header() {
  const { user } = await getCurrentUser();
  return <header className="site-header"><div className="container nav">
    <Link href="/" className="brand"><span className="brand-mark">A</span>AxomPrep</Link>
    <nav className="nav-links" aria-label="Primary navigation"><Link href="/notes">Notes</Link><Link href="/tests">Mock Tests</Link><Link href="/gk">Assam GK</Link><Link href="/current-affairs">Current Affairs</Link><Link href="/search">Search</Link><Link href="/dashboard">Dashboard</Link>{user ? <LogoutButton /> : <Link className="btn btn-primary" href="/login">Login</Link>}</nav>
    <MobileNav signedIn={Boolean(user)} />
  </div></header>;
}
