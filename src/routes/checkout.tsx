import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { STORE, formatPrice } from "@/lib/store-info";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: `تأكيد الحجز | ${STORE.name}` },
      { name: "description", content: "أدخل بياناتك وحدد تاريخ ووقت استلام الطلب من المحل." },
      { property: "og:title", content: `تأكيد الحجز | ${STORE.name}` },
      { property: "og:description", content: "تأكيد حجز مواد البناء وتحديد موعد الاستلام." },
    ],
  }),
  component: CheckoutPage,
});

const PICKUP_TIMES = [
  "08:00 - 10:00 صباحًا",
  "10:00 - 12:00 ظهرًا",
  "12:00 - 3:00 عصرًا",
  "3:00 - 6:00 مساءً",
  "6:00 - 9:00 مساءً",
];

const schema = z.object({
  customerName: z
    .string()
    .trim()
    .min(3, { message: "الرجاء إدخال الاسم الكامل (3 أحرف على الأقل)" })
    .max(100, { message: "الاسم طويل جدًا" }),
  customerPhone: z
    .string()
    .trim()
    .regex(/^[0-9+]{9,15}$/, { message: "رقم الجوال غير صحيح" }),
  pickupDate: z.string().min(1, { message: "الرجاء اختيار تاريخ الاستلام" }),
  pickupTime: z.string().min(1, { message: "الرجاء اختيار وقت الاستلام" }),
  notes: z.string().trim().max(500, { message: "الملاحظات طويلة جدًا" }).optional(),
});

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const navigate = Route.useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    pickupDate: "",
    pickupTime: PICKUP_TIMES[0] as string,
    notes: "",
  });

  const today = new Date().toISOString().slice(0, 10);

  const update = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const { data, error } = await supabase.rpc("create_order", {
      p_customer_name: parsed.data.customerName,
      p_customer_phone: parsed.data.customerPhone,
      p_pickup_date: parsed.data.pickupDate,
      p_pickup_time: parsed.data.pickupTime,
      p_notes: parsed.data.notes ?? "",
      p_items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
    });

    setSubmitting(false);

    if (error || !data) {
      toast.error("تعذّر إرسال الطلب", { description: "الرجاء المحاولة مرة أخرى." });
      return;
    }

    clear();
    toast.success("تم إرسال طلبك بنجاح");
    navigate({ to: "/order/$orderNumber", params: { orderNumber: String(data) } });
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">لا توجد منتجات في طلبك</h1>
        <p className="mt-2 text-muted-foreground">أضف منتجات إلى السلة أولًا لتتمكن من الحجز.</p>
        <Button asChild className="mt-6">
          <Link to="/products" search={{ q: "", cat: "" }}>
            تصفح المنتجات
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold">بيانات العميل وتأكيد الحجز</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        لا حاجة لإنشاء حساب — فقط املأ البيانات التالية وسنجهّز طلبك للاستلام من المحل.
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم الكامل *</Label>
              <Input
                id="name"
                maxLength={100}
                value={form.customerName}
                onChange={(e) => update("customerName")(e.target.value)}
                placeholder="مثال: محمد عبدالله"
              />
              {errors["customerName"] && (
                <p className="text-xs text-destructive">{errors["customerName"]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الجوال *</Label>
              <Input
                id="phone"
                inputMode="tel"
                maxLength={15}
                value={form.customerPhone}
                onChange={(e) => update("customerPhone")(e.target.value.replace(/[^\d+]/g, ""))}
                placeholder="05xxxxxxxx"
              />
              {errors["customerPhone"] && (
                <p className="text-xs text-destructive">{errors["customerPhone"]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">تاريخ الاستلام *</Label>
              <Input
                id="date"
                type="date"
                min={today}
                value={form.pickupDate}
                onChange={(e) => update("pickupDate")(e.target.value)}
              />
              {errors["pickupDate"] && (
                <p className="text-xs text-destructive">{errors["pickupDate"]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">وقت الاستلام *</Label>
              <select
                id="time"
                value={form.pickupTime}
                onChange={(e) => update("pickupTime")(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {PICKUP_TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              maxLength={500}
              rows={4}
              value={form.notes}
              onChange={(e) => update("notes")(e.target.value)}
              placeholder="أي تفاصيل إضافية تخص طلبك…"
            />
            {errors["notes"] && <p className="text-xs text-destructive">{errors["notes"]}</p>}
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-lg font-bold">ملخص الطلب</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-2">
                <span className="text-muted-foreground">
                  {i.name} × {i.quantity} {i.unit}
                </span>
                <span className="font-semibold">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border pt-3">
            <span className="font-semibold">الإجمالي</span>
            <span className="font-bold text-primary">{formatPrice(total)} ريال</span>
          </div>
          <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting}>
            {submitting ? "جاري الإرسال…" : "تأكيد الطلب"}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            الاستلام من المحل: {STORE.address}
          </p>
        </aside>
      </form>
    </div>
  );
}
