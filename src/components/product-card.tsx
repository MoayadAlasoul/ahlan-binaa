import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/store-info";

export type ProductRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  image_url: string | null;
  in_stock: boolean;
  stock_quantity: number;
  category_id: string;
};

export function ProductCard({
  product,
  categoryName,
}: {
  product: ProductRow;
  categoryName?: string | undefined;
}) {
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const available = product.in_stock && product.stock_quantity > 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-raised">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            width={800}
            height={600}
            className="h-full w-full object-cover"
          />
        )}
        <span
          className={`absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-bold ${
            available ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
          }`}
        >
          {available ? "متوفر" : "غير متوفر"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {categoryName && (
          <span className="text-xs font-semibold text-primary">{categoryName}</span>
        )}
        <h3 className="font-display text-base font-bold leading-snug">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>

        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-xl font-bold text-primary">{formatPrice(Number(product.price))}</span>
          <span className="text-sm text-muted-foreground">ريال / {product.unit}</span>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-3">
          <div className="flex items-center rounded-lg border border-border">
            <button
              type="button"
              aria-label="زيادة الكمية"
              className="px-2 py-2 text-muted-foreground hover:text-foreground"
              onClick={() => setQty((q) => Math.min(999, q + 1))}
            >
              <Plus className="h-4 w-4" />
            </button>
            <input
              aria-label="الكمية"
              value={qty}
              inputMode="numeric"
              onChange={(e) => {
                const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
                setQty(Number.isNaN(n) ? 1 : Math.min(999, Math.max(1, n)));
              }}
              className="w-10 border-x border-border bg-transparent py-1.5 text-center text-sm font-semibold outline-none"
            />
            <button
              type="button"
              aria-label="إنقاص الكمية"
              className="px-2 py-2 text-muted-foreground hover:text-foreground"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>

          <Button
            className="flex-1"
            disabled={!available}
            onClick={() => {
              addItem(
                {
                  productId: product.id,
                  name: product.name,
                  unit: product.unit,
                  price: Number(product.price),
                  imageUrl: product.image_url,
                },
                qty,
              );
              toast.success("تمت الإضافة إلى الطلب", { description: product.name });
              setQty(1);
            }}
          >
            <ShoppingCart className="h-4 w-4" />
            إضافة إلى الطلب
          </Button>
        </div>
      </div>
    </article>
  );
}
