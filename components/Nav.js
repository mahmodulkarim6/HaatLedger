'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const links = [
  ['/', 'Dashboard'], ['/farmers', 'Farmers'], ['/crops', 'Crops'], ['/markets', 'Markets'],
  ['/buyers', 'Buyers'], ['/supplies', 'Supplies'], ['/purchases', 'Purchases'], ['/report', 'Report'],
];

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  if (path === '/login') return null;
  const logout = async () => { await fetch('/api/logout', { method: 'POST' }); router.replace('/login'); router.refresh(); };
  return (
    <nav className="nav">
      <Link href="/" className="brand"><span className="seed" />Haat<b>Ledger</b></Link>
      <div className="links">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className={path === href ? 'on' : ''}>{label}</Link>
        ))}
      </div>
      <div className="navnote">
        <button className="btn ghost sm logout" onClick={logout}>Log out</button>
      </div>
    </nav>
  );
}
