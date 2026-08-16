import { Link } from "@tanstack/react-router";
import { Menu, Phone, ShoppingCart, Hammer } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { STORE } from "@/lib/store-info";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "الرئيسية" },
  { to: "/products", label: "المنتجات" },
  { to: "/track", label: "تتبع الطلب" },
  { to: "/cart", label: "سلة الطلب" },
] as const;

export function SiteHeader() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Hammer className="h-5 w-5" />
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block font-display text-base font-bold">{STORE.name}</span>
            <span className="block text-[11px] text-muted-foreground">{STORE.tagline}</span>
          </span>
        </Link>

        <nav className="mx-auto hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mr-auto flex items-center gap-2 md:mr-0">
          <a
            href={`tel:${STORE.phone}`}
            className="hidden items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium lg:flex"
          >
            <Phone className="h-4 w-4 text-primary" />
            {STORE.phoneDisplay}
          </a>
          <Button asChild variant="secondary" size="sm" className="relative">
            <Link to="/cart">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">سلة الطلب</span>
              {count > 0 && (
                <span className="absolute -top-2 -left-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="القائمة"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
