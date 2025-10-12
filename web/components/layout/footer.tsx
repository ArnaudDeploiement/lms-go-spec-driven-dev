import Link from "next/link";
import { Github, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t text-slate-50 border-[var(--border)] bg-slate/90 backdrop-blur-sm">
      <div className="container-custom flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2 max-w-xl">
          <p className="text-sm  font-medium text-[var(--accent-secondary)]">
            Créé par Arnaud Guiovanna &mdash; Product Manager AI &amp; Learning.
          </p>
          <Link
            href="/mentions-legales"
            className="inline-flex  items-center gap-2 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--accent-primary)]"
          >
            Mentions légales
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-[var(--accent-secondary)]">
          <a
            href="https://github.com/ArnaudDeploiement/lms-go-spec-driven-dev"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 transition-colors hover:border-[var(--border-strong)] hover:text-[var(--accent-primary)]"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/arnaud-guiovanna-5aa8b5159/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 transition-colors hover:border-[var(--border-strong)] hover:text-[var(--accent-primary)]"
          >
            <Linkedin className="h-4 w-4" aria-hidden="true" />
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
