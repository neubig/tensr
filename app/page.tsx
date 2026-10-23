import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-16">
        <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
          Coming soon
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Swipe. Match. Chat.
        </h1>
        <p className="text-muted-foreground max-w-md text-lg leading-8 text-pretty">
          {siteConfig.tagline}
        </p>
        <div className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
          <p className="text-sm leading-6">
            The app scaffold is in place. Onboarding, the swipe deck, and chat
            arrive with the M1 milestone.
          </p>
        </div>
      </main>
      <footer className="border-border/60 text-muted-foreground border-t px-6 py-6 text-xs">
        tensr is a toy. The models here are AI, not people.
      </footer>
    </div>
  );
}
