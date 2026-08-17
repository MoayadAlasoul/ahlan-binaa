import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, MapPin, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { OrderStatusSteps } from "@/components/order-status-steps";
import { STORE, formatDate, formatPrice, statusLabel } from "@/lib/store-info";

type OrderView = {
  order_number: string;
  customer_name: string;
  pickup_date: string;
  pickup_time: string;
  notes: string | null;
  status: string;
  total: number;
  created_at: string;
  items: { product_name: string; unit: string; unit_price: number; quantity: number }[];
};

export const Route = createFileRoute("/order/$orderNumber")({
  head: () => ({
    meta: [
      { title: `تفاصيل الطلب | ${STORE.name}` },
      { name: "description", content: "تفاصيل طلبك وحالته وموعد الاستلام من المحل." },
      { property: "og:title", content: `تفاصيل الطلب | ${STORE.name}` },
      { property: "og:description", content: "عرض حالة الطلب وتفاصيل الاستلام." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { orderNumber } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_order_by_number", {
        p_order_number: orderNumber,
      });
      if (error) throw error;
      return (data as unknown as OrderView | null) ?? null;
    },
  });

  if (isLoading) {
    return <p className="py-24 text-center text-muted-foreground">جاري تحميل بيانات الطلب…</p>;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">لم يتم العثور على الطلب</h1>
        <p className="mt-2 text-muted-foreground">
          تأكد من رقم الطلب ثم حاول مرة أخرى. رقم الطلب: {orderNumber}
        </p>
        <Button asChild className="mt-6">
          <Link to="/track">العودة لتتبع الطلب</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        <h1 className="mt-3 font-display text-2xl font-bold">تم تسجيل طلبك بنجاح</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          احتفظ برقم الطلب لمتابعة حالته أو عند الاستلام من المحل.
        </p>
        <p className="mt-4 inline-block rounded-xl bg-accent px-6 py-3 font-display text-xl font-extrabold tracking-wider text-accent-foreground">
          {data.order_number}
        </p>
        <p className="mt-3 text-sm">
          الحالة الحالية:{" "}
          <span className="font-bold text-primary">{statusLabel(data.status)}</span>
        </p>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold">حالة الطلب</h2>
          <div className="mt-4">
            <OrderStatusSteps status={data.status} />
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold">موعد الاستلام</h2>
            <p className="mt-3 flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              {formatDate(data.pickup_date)} — {data.pickup_time}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">باسم: {data.customer_name}</p>
            {data.notes && (
              <p className="mt-2 text-sm text-muted-foreground">ملاحظات: {data.notes}</p>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold">موقع المحل</h2>
            <p className="mt-3 flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 text-primary" />
              {STORE.address}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-primary" />
              <a href={`tel:${STORE.phone}`}>{STORE.phoneDisplay}</a>
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <iframe title="موقع المحل" src={STORE.mapEmbed} loading="lazy" className="h-48 w-full" />
            </div>
          </section>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="font-display text-lg font-bold">تفاصيل الطلب</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 font-medium">المنتج</th>
                <th className="py-2 font-medium">السعر</th>
                <th className="py-2 font-medium">الكمية</th>
                <th className="py-2 font-medium">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, idx) => (
                <tr key={idx} className="border-b border-border/60">
                  <td className="py-3 font-semibold">{item.product_name}</td>
                  <td className="py-3">
                    {formatPrice(Number(item.unit_price))} / {item.unit}
                  </td>
                  <td className="py-3">{item.quantity}</td>
                  <td className="py-3 font-bold">
                    {formatPrice(Number(item.unit_price) * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-between border-t border-border pt-3">
          <span className="font-semibold">الإجمالي</span>
          <span className="font-bold text-primary">{formatPrice(Number(data.total))} ريال</span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">الدفع عند الاستلام من المحل.</p>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link to="/products" search={{ q: "", cat: "" }}>
            متابعة التسوق
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/track">تتبع طلب آخر</Link>
        </Button>
      </div>
    </div>
  );
}
