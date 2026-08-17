import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/store-info";

type Category = { id: string; name: string; slug: string; image_url: string | null };
type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  image_url: string | null;
  in_stock: boolean;
  stock_quantity: number;
  is_featured: boolean;
};

const emptyForm = {
  id: "",
  category_id: "",
  name: "",
  description: "",
  price: "0",
  unit: "قطعة",
  image_url: "",
  in_stock: true,
  stock_quantity: "0",
  is_featured: false,
};

const schema = z.object({
  name: z.string().trim().min(2, { message: "اسم المنتج مطلوب" }).max(120),
  description: z.string().trim().max(500),
  category_id: z.string().uuid({ message: "اختر القسم" }),
  unit: z.string().trim().min(1, { message: "الوحدة مطلوبة" }).max(30),
  image_url: z.string().trim().max(300),
  price: z.number().min(0).max(1000000),
  stock_quantity: z.number().int().min(0).max(1000000),
});

export function AdminProducts() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...emptyForm });
  const [showForm, setShowForm] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, image_url")
        .order("sort_order");
      if (error) throw error;
      return data as unknown as Category[];
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["featured-products"] });
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      name: form.name,
      description: form.description,
      category_id: form.category_id,
      unit: form.unit,
      image_url: form.image_url,
      price: Number(form.price),
      stock_quantity: Number(form.stock_quantity),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
      return;
    }

    const payload = {
      ...parsed.data,
      image_url: parsed.data.image_url || null,
      in_stock: form.in_stock,
      is_featured: form.is_featured,
    };

    const { error } = form.id
      ? await supabase.from("products").update(payload).eq("id", form.id)
      : await supabase.from("products").insert(payload);

    if (error) {
      toast.error("تعذّر حفظ المنتج", { description: error.message });
      return;
    }
    toast.success(form.id ? "تم تعديل المنتج" : "تمت إضافة المنتج");
    setForm({ ...emptyForm });
    setShowForm(false);
    refresh();
  }

  async function remove(id: string) {
    if (!confirm("هل تريد حذف هذا المنتج؟")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("تعذّر حذف المنتج");
      return;
    }
    toast.success("تم حذف المنتج");
    refresh();
  }

  async function quickUpdate(id: string, patch: Partial<Product>) {
    const { error } = await supabase.from("products").update(patch).eq("id", id);
    if (error) {
      toast.error("تعذّر التحديث");
      return;
    }
    refresh();
  }

  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h2 className="font-display text-xl font-bold">إدارة المنتجات</h2>
        <Button
          onClick={() => {
            setForm({ ...emptyForm, category_id: categories?.[0]?.id ?? "" });
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" />
          إضافة منتج
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={save}
          className="mb-6 grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-card sm:grid-cols-2"
        >
          <div className="space-y-2">
            <Label htmlFor="p-name">اسم المنتج</Label>
            <Input
              id="p-name"
              value={form.name}
              maxLength={120}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-cat">القسم</Label>
            <select
              id="p-cat"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">اختر القسم</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="p-desc">وصف مختصر</Label>
            <Textarea
              id="p-desc"
              rows={2}
              maxLength={500}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-price">السعر (ريال)</Label>
            <Input
              id="p-price"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-unit">الوحدة</Label>
            <Input
              id="p-unit"
              value={form.unit}
              maxLength={30}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-qty">الكمية في المخزون</Label>
            <Input
              id="p-qty"
              inputMode="numeric"
              value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-img">رابط الصورة</Label>
            <Input
              id="p-img"
              value={form.image_url}
              maxLength={300}
              placeholder="/images/cement.jpg"
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.in_stock}
                onChange={(e) => setForm({ ...form, in_stock: e.target.checked })}
              />
              متوفر
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              />
              منتج مميز
            </label>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">{form.id ? "حفظ التعديلات" : "إضافة المنتج"}</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setForm({ ...emptyForm });
              }}
            >
              إلغاء
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">جاري تحميل المنتجات…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
          <table className="w-full min-w-[720px] text-right text-sm">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">المنتج</th>
                <th className="p-3 font-medium">السعر</th>
                <th className="p-3 font-medium">المخزون</th>
                <th className="p-3 font-medium">التوفر</th>
                <th className="p-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {(products ?? []).map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3">
                    <span className="font-semibold">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {categories?.find((c) => c.id === p.category_id)?.name}
                    </span>
                  </td>
                  <td className="p-3">
                    <input
                      aria-label={`سعر ${p.name}`}
                      defaultValue={String(p.price)}
                      inputMode="decimal"
                      className="w-24 rounded-md border border-input bg-transparent px-2 py-1"
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (!Number.isNaN(v) && v !== Number(p.price)) {
                          quickUpdate(p.id, { price: v });
                          toast.success("تم تعديل السعر");
                        }
                      }}
                    />
                    <span className="mr-1 text-xs text-muted-foreground">/ {p.unit}</span>
                  </td>
                  <td className="p-3">
                    <input
                      aria-label={`مخزون ${p.name}`}
                      defaultValue={String(p.stock_quantity)}
                      inputMode="numeric"
                      className="w-20 rounded-md border border-input bg-transparent px-2 py-1"
                      onBlur={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!Number.isNaN(v) && v !== p.stock_quantity) {
                          quickUpdate(p.id, { stock_quantity: v });
                          toast.success("تم تحديث المخزون");
                        }
                      }}
                    />
                  </td>
                  <td className="p-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={p.in_stock}
                        onChange={(e) => quickUpdate(p.id, { in_stock: e.target.checked })}
                      />
                      <span className={p.in_stock ? "text-success" : "text-destructive"}>
                        {p.in_stock ? "متوفر" : "غير متوفر"}
                      </span>
                    </label>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setForm({
                            id: p.id,
                            category_id: p.category_id,
                            name: p.name,
                            description: p.description,
                            price: String(p.price),
                            unit: p.unit,
                            image_url: p.image_url ?? "",
                            in_stock: p.in_stock,
                            stock_quantity: String(p.stock_quantity),
                            is_featured: p.is_featured,
                          });
                          setShowForm(true);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="p-3 text-xs text-muted-foreground">
            إجمالي المنتجات: {products?.length ?? 0} — قيمة المخزون تحسب حسب الأسعار الحالية (
            {formatPrice((products ?? []).reduce((s, p) => s + Number(p.price) * p.stock_quantity, 0))}{" "}
            ريال)
          </p>
        </div>
      )}
    </div>
  );
}
