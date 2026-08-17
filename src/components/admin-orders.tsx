import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ORDER_STATUSES, formatDate, formatPrice, statusLabel } from "@/lib/store-info";

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  pickup_date: string;
  pickup_time: string;
  notes: string | null;
  status: string;
  total: number;
  created_at: string;
};

type ItemRow = {
  id: string;
  product_name: string;
  unit: string;
  unit_price: number;
  quantity: number;
};

export function AdminOrders() {
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as OrderRow[];
    },
  });

  const { data: items } = useQuery({
    queryKey: ["admin-order-items", openId],
    enabled: !!openId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("id, product_name, unit, unit_price, quantity")
        .eq("order_id", openId!);
      if (error) throw error;
      return data as unknown as ItemRow[];
    },
  });

  async function changeStatus(id: string, status: string) {
    const { error } = await supabase
      .from("orders")
      .update({ status: status as OrderRow["status"] })
      .eq("id", id);
    if (error) {
      toast.error("تعذّر تحديث حالة الطلب");
      return;
    }
    toast.success("تم تحديث حالة الطلب");
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  }

  const visible = (orders ?? []).filter((o) => !filter || o.status === filter);

  if (isLoading) return <p className="text-muted-foreground">جاري تحميل الطلبات…</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("")}
          className={`rounded-full border px-4 py-1.5 text-sm ${!filter ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
        >
          كل الطلبات ({orders?.length ?? 0})
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setFilter(s.key)}
            className={`rounded-full border px-4 py-1.5 text-sm ${filter === s.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          لا توجد طلبات.
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((order) => (
            <div key={order.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold">{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.customer_name} — {order.customer_phone}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    الاستلام: {formatDate(order.pickup_date)} — {order.pickup_time}
                  </p>
                  {order.notes && (
                    <p className="mt-1 text-sm text-muted-foreground">ملاحظات: {order.notes}</p>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-bold text-primary">{formatPrice(Number(order.total))} ريال</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    الحالة: {statusLabel(order.status)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <label className="text-sm text-muted-foreground" htmlFor={`st-${order.id}`}>
                  تغيير الحالة
                </label>
                <select
                  id={`st-${order.id}`}
                  value={order.status}
                  onChange={(e) => changeStatus(order.id, e.target.value)}
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="mr-auto text-sm font-semibold text-primary hover:underline"
                  onClick={() => setOpenId(openId === order.id ? null : order.id)}
                >
                  {openId === order.id ? "إخفاء المنتجات" : "عرض المنتجات"}
                </button>
              </div>

              {openId === order.id && (
                <div className="mt-4 overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-muted/60 text-muted-foreground">
                      <tr>
                        <th className="p-2 font-medium">المنتج</th>
                        <th className="p-2 font-medium">السعر</th>
                        <th className="p-2 font-medium">الكمية</th>
                        <th className="p-2 font-medium">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(items ?? []).map((it) => (
                        <tr key={it.id} className="border-t border-border">
                          <td className="p-2">{it.product_name}</td>
                          <td className="p-2">
                            {formatPrice(Number(it.unit_price))} / {it.unit}
                          </td>
                          <td className="p-2">{it.quantity}</td>
                          <td className="p-2 font-semibold">
                            {formatPrice(Number(it.unit_price) * it.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
