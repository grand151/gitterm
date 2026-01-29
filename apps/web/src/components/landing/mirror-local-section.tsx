import Image from "next/image";
import { Check } from "lucide-react";

const providers = [
  { src: "/opencode-zen.svg", label: "OpenCode Zen", emphasis: true },
  { src: "/openai-codex.svg", label: "OpenAI Codex" },
  { src: "/zai-coding-plan.svg", label: "Zai Coding Plan" },
  { src: "/github-copilot.svg", label: "GitHub Copilot" },
];

export function MirrorLocalSection() {
  return (
    <section id="opencode-sync" className="border-t border-border py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex w-fit items-center rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Mirror local setup
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Mirror your local development environment
            </h2>
            <p className="text-lg text-muted-foreground">
              Add provider keys in the GitTerm dashboard for authentication, then paste your
              OpenCode config to have your similar local experience.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 text-primary" />
                Auth with providers using API keys or Oauth
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 text-primary" />
                Copy and paste in your config once and use for all instances
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-x-6 -top-6 h-24 rounded-[24px] bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
            <div className="relative rounded-2xl border border-border bg-background/70 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">opencode.json</span>
                <span className="rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  Synced
                </span>
              </div>
              <pre className="mt-4 rounded-xl border border-border/60 bg-secondary/40 p-4 text-xs text-muted-foreground sm:text-sm">
                <code>{`{
  "$schema": "https://opencode.ai/config.json",
  "theme": "tokyonight"
  "permission": {
    "edit": "ask",
    "bash": "ask"
  }
}`}</code>
              </pre>
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Authenticated providers
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {providers.map((provider) => (
                    <div
                      key={provider.label}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                        provider.emphasis
                          ? "border-primary/40 bg-primary/10 text-foreground"
                          : "border-border/60 bg-secondary/30 text-muted-foreground"
                      }`}
                    >
                      <Image
                        src={provider.src}
                        alt={provider.label}
                        width={18}
                        height={18}
                        className="h-4 w-auto opacity-90"
                      />
                      <span>{provider.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
