import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BellRing,
  LayoutDashboard,
  Menu,
  MessageSquareHeart,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useStore } from "@/lib/store";
import { Logo } from "./bits";
import { LocationPicker } from "./LocationPicker";

const nav = [
  { to: "/", label: "Home" },
  { to: "/medicines", label: "Medicines" },
  { to: "/reminders", label: "Reminders" },
  { to: "/consult", label: "Consult Doctors" },
  { to: "/doctor-chat", label: "Chat with Doctor" },
  { to: "/nearby", label: "Find Doctors Near Me" },
  { to: "/upload", label: "Upload Rx" },
  { to: "/how-it-works", label: "How It Works" },
] as const;

export function Header() {
  const { cartCount, user } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/medicines", search: { q: q.trim() || undefined } });
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
        <Logo showTagline />
        <search className="ml-3 hidden max-w-sm flex-1 lg:block">
          <form onSubmit={submit} className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search medicines, first aid, or pharmacies…"
              className="rounded-full bg-soft/60 pl-9"
              aria-label="Search medicines"
            />
          </form>
        </search>
        <div className="hidden md:block">
          <LocationPicker compact />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden rounded-full border-primary/25 bg-secondary/70 text-secondary-foreground hover:bg-secondary md:inline-flex"
          >
            <Link to="/doctor-chat">
              <MessageSquareHeart className="h-4 w-4 text-primary" /> Chat with Doctor
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            aria-label={`Cart with ${cartCount} items`}
          >
            <Link to="/cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
          </Button>
          <Button asChild className="hidden rounded-full sm:inline-flex">
            <Link to={user ? "/account" : "/login"}>
              {user ? <LayoutDashboard className="h-4 w-4" /> : <User className="h-4 w-4" />}
              {user ? `${user.name.split(" ")[0]} (${user.role})` : "Login / Sign Up"}
            </Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-80 overflow-y-auto">
              <SheetTitle className="sr-only">CAREVIA Navigation Menu</SheetTitle>
              <div className="mt-6 flex flex-col gap-3">
                <form onSubmit={submit}>
                  <Input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search medicines…"
                    aria-label="Search medicines"
                  />
                </form>
                <LocationPicker />
                {nav.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 font-medium hover:bg-accent"
                    activeProps={{
                      className: "bg-accent text-primary font-semibold",
                      "aria-current": "page" as const,
                    }}
                    activeOptions={{ exact: n.to === "/" }}
                  >
                    {n.label}
                  </Link>
                ))}
                <Link
                  to="/account"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 font-medium hover:bg-accent"
                >
                  Partner & Patient Dashboards
                </Link>
                <Link
                  to={user ? "/account" : "/login"}
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-primary px-3 py-2 text-center font-semibold text-primary-foreground"
                >
                  {user ? `Account (${user.role})` : "Login / Sign Up"}
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <nav
        className="mx-auto hidden max-w-7xl items-center gap-1 px-6 pb-2 xl:flex"
        aria-label="Primary"
      >
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
            activeProps={{
              className: "!bg-secondary !text-primary font-semibold",
              "aria-current": "page" as const,
            }}
            activeOptions={{ exact: n.to === "/" }}
          >
            {n.label}
          </Link>
        ))}
        <Link
          to="/account"
          className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
          activeProps={{
            className: "!bg-secondary !text-primary font-semibold",
            "aria-current": "page" as const,
          }}
        >
          Dashboards
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/reminders"
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-primary hover:bg-accent"
          >
            <BellRing className="h-3.5 w-3.5" /> Medication Schedule
          </Link>
          <Link
            to="/urgent"
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
          >
            Urgent Care (112)
          </Link>
        </div>
      </nav>
    </header>
  );
}
