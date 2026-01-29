import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="border-t border-border py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <p className="mb-3 inline-flex items-center rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Get started
        </p>
        <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl text-balance">
          Build with OpenCode in minutes
        </h2>
        <p className="mx-auto mb-6 max-w-lg text-lg text-muted-foreground">
          Free tier included. No credit card required.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/dashboard">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Get Started for Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="https://github.com/OpeOginni/gitterm" target="_blank">
            <Button
              variant="outline"
              size="lg"
              className="border-border text-foreground hover:bg-secondary bg-transparent"
            >
              View Source
            </Button>
          </Link>
        </div>
        <div className="mt-5">
          <p className="mb-3 text-sm text-muted-foreground">Or deploy your own Infra</p>
          <Link
            href="https://railway.com/deploy/gitterm?referralCode=o9MFOP&utm_medium=integration&utm_source=template&utm_campaign=generic"
            target="_blank"
          >
            <img
              src="https://railway.com/button.svg"
              alt="Deploy on Railway"
              className="mx-auto"
              height={32}
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
