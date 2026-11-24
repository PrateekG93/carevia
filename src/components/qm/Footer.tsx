import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "./bits";
import { infoPages } from "@/lib/info";

export function Footer() {
  const [email, setEmail] = useState("");
  const sub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    toast.success("Subscribed to CAREVIA launch updates (demo — email service not connected).");
    setEmail("");
  };

  return (
    <footer className="mt-16 border-t bg-soft">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4 md:px-6">
        <div className="md:col-span-1">
          <Logo showTagline />
          <p className="mt-3 text-sm font-semibold text-foreground">
            Healthcare, Connected. Care, Delivered.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            CAREVIA is an integrated healthcare ecosystem connecting Patients ↔ Doctors ↔
            Pharmacies.
          </p>
          <div className="mt-4 flex gap-2">
            {[Instagram, Twitter, Facebook, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toast.message("CAREVIA social channels will be linked at launch.");
                }}
                className="grid h-9 w-9 place-items-center rounded-full border bg-background text-muted-foreground hover:text-primary"
                aria-label="Social media (coming soon)"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">CAREVIA Ecosystem</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/about" className="hover:text-primary">
                About CAREVIA
              </Link>
            </li>
            <li>
              <Link to="/medicines" className="hover:text-primary">
                Order Medicines (30-min Target)
              </Link>
            </li>
            <li>
              <Link to="/reminders" className="hover:text-primary">
                Medicine Reminders
              </Link>
            </li>
            <li>
              <Link to="/doctor-chat" className="hover:text-primary">
                Chat with Doctor
              </Link>
            </li>
            <li>
              <Link to="/account" className="hover:text-primary">
                Patient, Doctor & Pharmacy Portals
              </Link>
            </li>
            {infoPages.slice(0, 2).map((p) => (
              <li key={p.slug}>
                <Link to="/info/$slug" params={{ slug: p.slug }} className="hover:text-primary">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Trust & Policies</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {infoPages.slice(2).map((p) => (
              <li key={p.slug}>
                <Link to="/info/$slug" params={{ slug: p.slug }} className="hover:text-primary">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Launch Updates</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Health reminders and CAREVIA partner expansion news.
          </p>
          <form onSubmit={sub} className="flex gap-2">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              type="email"
              aria-label="Email"
              className="bg-background"
            />
            <Button type="submit">Join</Button>
          </form>
        </div>
      </div>
      <div className="border-t py-5 text-center text-xs text-muted-foreground">
        © 2026 CAREVIA — Healthcare, Connected. Care, Delivered. General health information does not
        replace professional medical advice.
      </div>
    </footer>
  );
}
