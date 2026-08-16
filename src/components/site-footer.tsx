import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Phone } from "lucide-react";
import { STORE } from "@/lib/store-info";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-secondary text-secondary-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <h3 className="font-display text-lg font-bold">{STORE.name}</h3>
          <p className="mt-2 text-sm text-secondary-foreground/70">{STORE.tagline}</p>
          <p className="mt-4 text-sm text-secondary-foreground/70">
            احجز مواد البناء أونلاين واستلمها من المحل في الوقت الذي يناسبك.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <h4 className="font-display font-bold">معلومات التواصل</h4>
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <a href={`tel:${STORE.phone}`}>{STORE.phoneDisplay}</a>
          </p>
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-primary" />
            {STORE.address}
          </p>
          <p className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 text-primary" />
            {STORE.hours}
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <h4 className="font-display font-bold">روابط سريعة</h4>
          <Link to="/products" className="block hover:text-primary">
            تصفح المنتجات
          </Link>
          <Link to="/cart" className="block hover:text-primary">
            سلة الطلب
          </Link>
          <Link to="/track" className="block hover:text-primary">
            تتبع الطلب
          </Link>
          <Link to="/auth" className="block hover:text-primary">
            دخول الإدارة
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-secondary-foreground/60">
        جميع الحقوق محفوظة © {new Date().getFullYear()} {STORE.name}
      </div>
    </footer>
  );
}
