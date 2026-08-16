import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { STORE, formatPrice } from "@/lib/store-info";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: `سلة الطلب | ${STORE.name}` },
      { name: "description", content: "راجع منتجات طلبك وعدّل الكميات قبل تأكيد الحجز والاستلام من المحل." },
      { property: "og:title", content: `سلة الطلب | ${STORE.name}` },
      { property: "og:description", content: "مراجعة الطلب وتعديل الكميات قبل تأكيد الحجز." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQuantity, removeItem, total, clear } = useCart();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold">سلة الطلب</h1>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">سلة الطلب فارغة حاليًا.</p>
          <Button asChild className="mt-5">
            <Link to="/products">تصفح المنتجات</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-card"
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    width={800}
                    height={600}
                    className="h-24 w-24 shrink-0 rounded-xl object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col">
                  <h2 className="font-display font-bold">{item.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(item.price)} ريال / {item.unit}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
                    <div className="flex items-center rounded-lg border border-border">
                      <button
                        type="button"
                        aria-label="زيادة الكمية"
                        className="px-2 py-2"
                        onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <span className="w-10 border-x border-border py-1.5 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="إنقاص الكمية"
                        className="px-2 py-2"
                        onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-bold text-primary">
                      {formatPrice(item.price * item.quantity)} ريال
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mr-auto text-destructive"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={clear}>
              إفراغ السلة
            </Button>
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-card lg:sticky lg:top-24">
            <h2 className="font-display text-lg font-bold">ملخص الطلب</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">عدد المنتجات</span>
                <span className="font-semibold">{items.length}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <span className="font-semibold">الإجمالي</span>
                <span className="font-bold text-primary">{formatPrice(total)} ريال</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              الطلب للحجز والاستلام من المحل، والدفع يتم عند الاستلام.
            </p>
            <Button asChild className="mt-5 w-full" size="lg">
              <Link to="/checkout">متابعة تأكيد الطلب</Link>
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
