import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { TerminalDemo } from "@/components/landing/terminal-demo";
import Link from "next/link";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
      {/* Glow effect */}
      <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />

      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div className="flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-3 rounded-full border border-border bg-secondary/60 px-4 py-2 text-sm text-muted-foreground">
              <Image src="/opencode.svg" alt="OpenCode" width={18} height={22} className="h-5 w-auto" />
              <span className="font-semibold text-foreground">OpenCode</span>
              <span className="text-muted-foreground">powered workspaces</span>
            </div>

            <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl text-balance">
              Remote workspaces for
              <br />
              <span className="text-muted-foreground">AI coding agents.</span>
            </h1>

            <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Launch cloud-hosted{" "}
              <Link
                href={"https://opencode.ai/"}
                target="_blank"
                className="font-bold text-primary underline"
              >
                OpenCode
              </Link>{" "}
              in seconds, or tunnel your local environment through secure, shareable URLs.
              <br />
              Keep stateful workspaces and ship from any device, anywhere.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-primary/80 text-primary-foreground hover:bg-primary/70"
                >
                  Start Building
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="https://x.com/BrightOginni/status/2011107736176763131" target="_blank">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border text-foreground hover:bg-secondary bg-transparent"
                >
                  <ArrowUpRight className="mr-2 h-4 w-4 border-primary text-primary" />
                  Agentic Loops Demo
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <TerminalDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
