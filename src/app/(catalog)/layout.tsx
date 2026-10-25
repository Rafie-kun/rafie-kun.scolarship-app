import Link from 'next/link';

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand">
            ScholarPath
          </Link>
          <Link href="/scholarships" className="navlink">
            Scholarships
          </Link>
          <Link href="/opportunities" className="navlink">
            Opportunities
          </Link>
          <Link href="/apply" className="navlink">
            How to Apply
          </Link>
          <Link href="/app" className="navlink">
            Dashboard
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
