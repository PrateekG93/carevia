import { createFileRoute, Link } from "@tanstack/react-router";
import { Siren, Stethoscope, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, SectionHeader } from "@/components/qm/bits";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/urgent")({
  head: () =>
    pageHead(
      "Urgent and Emergency Care",
      "Get emergency guidance immediately, without sign-in or location permission.",
    ),
  component: () => (
    <PageShell>
      <SectionHeader
        title="Feeling Very Unwell? Find the Right Care."
        subtitle="If you have a high fever or feel seriously unwell, get appropriate medical advice and find medical care near you."
      />
      <section className="border-l-4 border-destructive bg-destructive/5 p-6">
        <Siren className="mb-3 h-8 w-8 text-destructive" />
        <h2 className="text-2xl font-bold">Severe symptoms? Get emergency help now.</h2>
        <p className="mt-3">
          Difficulty breathing, chest pain, unconsciousness, new confusion, seizures, severe
          bleeding, or other life-threatening symptoms need immediate emergency care.
        </p>
        <p className="mt-3 font-semibold">
          Call your local emergency number or go to the nearest emergency department. In India, call
          112.
        </p>
        <Button asChild variant="destructive" className="mt-5">
          <a href="tel:112">Call 112 (India)</a>
        </Button>
        <p className="mt-4 text-sm">
          Do not wait for a medicine delivery, routine booking, or online consultation. Ask someone
          to stay with you. Do not drive yourself if you are seriously unwell.
        </p>
      </section>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <section>
          <Stethoscope className="h-8 w-8 text-primary" />
          <h2 className="mt-3 text-xl font-bold">Consult a doctor online</h2>
          <p className="mt-3 text-muted-foreground">
            For non-emergency symptoms appropriate for remote assessment. High or persistent fever
            should be assessed promptly; a physical examination or tests may be needed.
          </p>
          <Button asChild className="mt-4">
            <Link to="/consult">Consult a Doctor Online</Link>
          </Button>
        </section>
        <section>
          <MapPin className="h-8 w-8 text-teal" />
          <h2 className="mt-3 text-xl font-bold">Find nearby medical care</h2>
          <p className="mt-3 text-muted-foreground">
            Some illnesses require an in-person assessment. Find a clinic or hospital and confirm
            its services directly.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/nearby">Find Nearby Medical Care</Link>
          </Button>
        </section>
      </div>
    </PageShell>
  ),
});
