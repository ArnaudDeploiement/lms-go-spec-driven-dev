import { Navigation } from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navigation />
      <main className="container-custom pt-32 pb-24">
        <div className="max-w-3xl">
          <Card className="border border-[var(--border)] shadow-none">
            <CardHeader className="space-y-3">
              <p className="text-sm uppercase tracking-wide text-[var(--muted-foreground)]">Informations légales</p>
              <CardTitle className="text-3xl text-[var(--accent-secondary)]">Mentions légales</CardTitle>
              <p className="text-sm text-[var(--muted-foreground)]">
                Ce projet est développé et maintenu dans une démarche open source, à destination des organisations qui souhaitent proposer des expériences d'apprentissage modernes.
              </p>
            </CardHeader>
            <CardContent className="space-y-6 text-sm leading-relaxed text-[var(--accent-secondary)]">
              <section className="space-y-2">
                <h2 className="text-base font-semibold text-[var(--accent-secondary)]">Auteur</h2>
                <p>Arnaud Guiovanna</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold text-[var(--accent-secondary)]">Développement</h2>
                <p>Spec Driven Development</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold text-[var(--accent-secondary)]">Licence</h2>
                <p>
                  Open source – usage commercial et non commercial autorisé. Vous pouvez librement étudier, modifier et distribuer ce projet dans le respect de la licence.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
