import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STORE, ORDER_STATUSES } from "@/lib/store-info";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: `تتبع الطلب | ${STORE.name}` },
      { name: "description", content: "أدخل رقم طلبك لمعرفة حالة التجهيز وموعد الاستلام من المحل." },
      { property: "og:title", content: `تتبع الطلب | ${STORE.name}` },
      { property: "og:description", content: "تابع حالة طلبك خطوة بخطوة حتى الاستلام." },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const navigate = Route.useNavigate();
  const [value, setValue] = useState("");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">تتبع الطلب</h1>
      <p className="mt-2 text-muted-foreground">
        أدخل رقم الطلب الذي ظهر لك عند تأكيد الحجز (مثال: BM-260817-1234).
      </p>

      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = value.trim();
          if (!trimmed) return;
          navigate({ to: "/order/$orderNumber", params: { orderNumber: trimmed } });
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            maxLength={30}
            aria-label="رقم الطلب"
            placeholder="رقم الطلب"
            className="h-12 pr-10"
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <Button type="submit" size="lg" className="h-12">
          بحث
        </Button>
      </form>

      <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="font-display text-lg font-bold">مراحل الطلب</h2>
        <ol className="mt-4 flex flex-wrap gap-2 text-sm">
          {ORDER_STATUSES.map((s, i) => (
            <li key={s.key} className="flex items-center gap-2">
              <span className="rounded-full bg-muted px-3 py-1 font-semibold">{s.label}</span>
              {i < ORDER_STATUSES.length - 1 && <span className="text-muted-foreground">←</span>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
