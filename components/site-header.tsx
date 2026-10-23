import Link from "next/link";

import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="border-border/60 border-b">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-foreground text-lg font-semibold tracking-tight"
        >
          {siteConfig.name}
        </Link>
        <span className="text-muted-foreground text-xs tracking-wide uppercase">
          Pre-alpha
        </span>
      </div>
    </header>
  );
}
