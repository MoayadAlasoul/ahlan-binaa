import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { ProductCard, type ProductRow } from "@/components/product-card";
import { STORE } from "@/lib/store-info";

type ProductSearch = { q: string; cat: string };

export const Route = createFileRoute("/products")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => ({
    q: typeof search['q'] === "string" ? (search['q'] as string).slice(0, 80) : "",
    cat: typeof search['cat'] === "string" ? (search['cat'] as string).slice(0, 40) : "",
  }),
  head: () => ({
    meta: [
      { title: `المنتجات | ${STORE.name}` },
      {
        name: "description",
        content:
          "تصفح جميع منتجات مواد البناء: الإسمنت، الحديد، البلوك، الرمل، البلاط، السباكة، الكهرباء، الدهانات، العدد، العزل والتشطيب.",
      },
      { property: "og:title", content: `المنتجات | ${STORE.name}` },
      { property: "og:description", content: "أسعار محدّثة وحالة توفر لكل منتج مع إمكانية الحجز." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { q, cat } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState(q);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, slug, name, image_url")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return data as unknown as ProductRow[];
    },
  });

  const categoryById = useMemo(
    () => new Map((categories ?? []).map((c) => [c.id, c])),
    [categories],
  );
  const activeCategory = (categories ?? []).find((c) => c.slug === cat);

  const filtered = useMemo(() => {
    const term = query.trim();
    return (products ?? []).filter((p) => {
      const inCat = !activeCategory || p.category_id === activeCategory.id;
      const inTerm =
        !term || p.name.includes(term) || p.description.includes(term);
      return inCat && inTerm;
    });
  }, [products, query, activeCategory]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold">المنتجات</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        ابحث عن المنتج المناسب أو صفِّ النتائج حسب القسم.
      </p>

      <div className="relative mt-6 max-w-lg">
        <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          maxLength={80}
          aria-label="بحث عن المنتجات"
          placeholder="ابحث باسم المنتج…"
          className="h-12 pr-10"
          onChange={(e) => {
            setQuery(e.target.value);
            navigate({ search: { q: e.target.value, cat }, replace: true });
          }}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate({ search: { q: query, cat: "" } })}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            !cat
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card hover:bg-muted"
          }`}
        >
          كل الأقسام
        </button>
        {categories?.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => navigate({ search: { q: query, cat: c.slug } })}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              cat === c.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-muted"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">عدد النتائج: {filtered.length}</p>

      {isLoading ? (
        <p className="py-16 text-center text-muted-foreground">جاري تحميل المنتجات…</p>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">لا توجد منتجات مطابقة لبحثك.</p>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              categoryName={categoryById.get(p.category_id)?.name ?? ""}
            />
          ))}
        </div>
      )}
    </div>
  );
}
