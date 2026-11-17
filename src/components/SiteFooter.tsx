import { Sentences } from "@/components/Sentences";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__inner">
          <div>
            <Link href="/" className="brand">
              <Image src="/logo.svg" alt="" width={28} height={28} />
              {site.name}
            </Link>
            <Sentences text="The password manager you run yourself. End-to-end encrypted, free and open source." />
          </div>
          <nav aria-labelledby="footer-product">
            <h2 id="footer-product">Product</h2>
            <ul>
              <li><Link href="/#features">Features</Link></li>
              <li><Link href="/security">Security model</Link></li>
              <li><Link href="/self-host">Self-hosting guide</Link></li>
              <li><Link href="/#faq">FAQ</Link></li>
            </ul>
          </nav>
          <nav aria-labelledby="footer-project">
            <h2 id="footer-project">Project</h2>
            <ul>
              <li><a href={site.repoUrl}>Source code</a></li>
              <li><a href={`${site.repoUrl}/issues`}>Report an issue</a></li>
              <li><a href={`${site.repoUrl}#build`}>Build from source</a></li>
            </ul>
          </nav>
        </div>
        <p className="site-footer__legal">
          {site.name} is free software under the {site.license} license. Version{" "}
          {site.version}, pre-release.{" "}
          <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link>
        </p>
      </div>
    </footer>
  );
}
