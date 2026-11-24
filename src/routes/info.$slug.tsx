import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DemoBadge, PageShell, SectionHeader } from "@/components/qm/bits";
import { infoPages } from "@/lib/info";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/info/$slug")({
  loader: ({ params }) => {
    const page = infoPages.find((p) => p.slug === params.slug);
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData }) =>
    pageHead(
      loaderData?.title ?? "Information unavailable",
      loaderData?.body[0] ?? "CAREVIA information and policies.",
    ),
  notFoundComponent: () => (
    <PageShell>
      <h1 className="text-2xl font-bold">Information page not found</h1>
      <Link to="/" className="text-primary underline">
        Return home
      </Link>
    </PageShell>
  ),
  component: Info,
});

function Info() {
  const page = Route.useLoaderData();
  const [sent, setSent] = useState(false);

  return (
    <PageShell className="max-w-4xl">
      <SectionHeader eyebrow="CAREVIA Information" title={page.title}>
        <DemoBadge>Platform policy &amp; info</DemoBadge>
      </SectionHeader>
      {page.slug === "faq" ? (
        <Accordion type="single" collapsible>
          {page.body.map((p, i) => {
            const idx = p.indexOf("?");
            return (
              <AccordionItem key={i} value={String(i)}>
                <AccordionTrigger className="text-left">{p.slice(0, idx + 1)}</AccordionTrigger>
                <AccordionContent>{p.slice(idx + 1).trim()}</AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <div className="space-y-5 text-muted-foreground">
          {page.body.map((p) => (
            <p key={p} className="leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      )}
      {page.slug === "contact" && (
        <section className="mt-8 border-t pt-7">
          <h2 className="text-xl font-bold">Contact CAREVIA</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Demonstration contact form — messages are not sent or stored until email provider keys
            are configured. Do not enter personal medical details here.
          </p>
          {sent ? (
            <div role="status" className="mt-5 border-l-4 border-teal bg-soft p-5">
              Demo inquiry submitted (no email sent).{" "}
              <Button variant="ghost" onClick={() => setSent(false)}>
                New message
              </Button>
            </div>
          ) : (
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="contact-name">Name</Label>
                <Input id="contact-name" required minLength={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input id="contact-email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" required minLength={5} maxLength={1000} />
              </div>
              <Button type="submit">Submit Demo Inquiry</Button>
            </form>
          )}
        </section>
      )}
      <nav aria-label="Information pages" className="mt-10 flex flex-wrap gap-3 border-t pt-6">
        {infoPages
          .filter((p) => p.slug !== page.slug)
          .map((p) => (
            <Link
              key={p.slug}
              to="/info/$slug"
              params={{ slug: p.slug }}
              className="text-sm text-primary underline"
            >
              {p.title}
            </Link>
          ))}
      </nav>
    </PageShell>
  );
}
