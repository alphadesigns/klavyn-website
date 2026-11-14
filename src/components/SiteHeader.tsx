import Image from "next/image";
import Link from "next/link";
import { GithubIcon } from "@/components/icons";
import { MobileMenu } from "@/components/MobileMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { nav, site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="brand" aria-label={`${site.name} home`}>
          <Image src="/logo.svg" alt="" width={28} height={28} priority />
          {site.name}
        </Link>
        <nav className="site-nav" aria-label="Main">
          <ul className="site-nav__links">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="site-nav__link">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <MobileMenu />
          <ThemeToggle />
          <a href={site.repoUrl} className="btn btn--secondary btn--sm">
            <GithubIcon />
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
