import { Link } from "@tanstack/react-router";
import { FlaskConical, Loader2, Siren } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * CAREVIA Brand Logo:
 * A minimal healthcare-inspired symbol combining a crisp medical cross
 * with a connected circular pathway (representing Patient ↔ Doctor ↔ Pharmacy).
 */
export function CareviaMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" className="h-[76%] w-[76%]" fill="none">
        <circle
          cx="20"
          cy="20"
          r="14.5"
          stroke="oklch(0.86 0.085 162)"
          strokeWidth="2.2"
          strokeDasharray="18 5 18 5"
          strokeLinecap="round"
        />
        <circle cx="20" cy="5.5" r="2.3" fill="oklch(0.86 0.085 162)" />
        <circle cx="32.5" cy="27.2" r="2.3" fill="oklch(0.86 0.085 162)" />
        <circle cx="7.5" cy="27.2" r="2.3" fill="oklch(0.86 0.085 162)" />
        <path d="M17.5 11.5h5v6h6v5h-6v6h-5v-6h-6v-5h6v-6z" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <Link
      to="/"
      className={cn("flex items-center gap-2.5 font-display text-foreground", className)}
      aria-label="CAREVIA home"
    >
      <CareviaMark />
      <span className="leading-none">
        <span className="block text-xl font-extrabold tracking-tight text-primary">CAREVIA</span>
        {showTagline && (
          <span className="mt-0.5 block font-sans text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Healthcare, Connected
          </span>
        )}
      </span>
    </Link>
  );
}

export function CareviaLoader({ label = "Loading CAREVIA workspace…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-12 text-center"
    >
      <div className="relative flex items-center justify-center">
        <CareviaMark className="h-14 w-14" />
        <Loader2 className="absolute -inset-2 h-18 w-18 animate-spin text-teal/50" />
      </div>
      <div>
        <p className="font-display text-lg font-bold text-primary">CAREVIA</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function DemoBadge({
  children = "Demo data",
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning-foreground",
        className,
      )}
    >
      <FlaskConical className="h-3 w-3 shrink-0" aria-hidden="true" /> {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-teal">{eyebrow}</p>
        )}
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 text-lg text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12", className)}>
      {children}
    </div>
  );
}

export function EmergencyStrip() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center">
      <Siren className="h-6 w-6 shrink-0 text-destructive" aria-hidden="true" />
      <p className="text-sm text-foreground">
        <strong>Emergency?</strong> If you have difficulty breathing, chest pain, unconsciousness,
        new confusion, or a seizure, call{" "}
        <a className="font-bold text-destructive underline" href="tel:112">
          112
        </a>{" "}
        or go to the nearest emergency department now.
      </p>
      <Link
        to="/urgent"
        className="shrink-0 text-sm font-semibold text-destructive underline sm:ml-auto"
      >
        Emergency guidance
      </Link>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  children,
}: {
  icon: ReactNode;
  title: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed bg-soft px-6 py-14 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-accent text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-md text-muted-foreground">{text}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
