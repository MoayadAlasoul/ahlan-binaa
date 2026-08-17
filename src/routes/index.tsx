import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Clock, MapPin, Phone, Search, ShieldCheck, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard, type ProductRow } from "@/components/product-card";
import { STORE } from "@/lib/store-info";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${STORE.name} | حجز مواد البناء واستلامها من المحل` },
      {
        name: "description",
        content:
          "تصفح أقسام مواد البناء من إسمنت وحديد وبلوك وبلاط وسباكة وكهرباء، واحجز طلبك أونلاين ثم استلمه من المحل في الوقت المناسب لك.",
      },
      { property: "og:title", content: `${STORE.name} | مواد البناء` },
      {
        property: "og:description",
        content: "احجز مواد البناء أونلاين واستلمها من المحل. أسعار واضحة وتوفر محدّث.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [search, setSearch] = useState("");
  const navigate = Route.useNavigate();

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

  const { data: featured } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_featured", true)
        .limit(8);
      if (error) throw error;
      return data as unknown as ProductRow[];
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src="/images/hero.jpg"
          alt="محل مواد بناء"
          width={1600}
          height={912}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-white md:py-28">
          <span className="inline-block rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground">
            احجز الآن واستلم من المحل
          </span>
          <h1 className="mt-5 max-w-2xl font-display text-3xl font-extrabold leading-tight md:text-5xl">
            كل مواد البناء التي يحتاجها مشروعك في مكان واحد
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/85 md:text-lg">
            إسمنت، حديد، بلوك، بلاط، سباكة، كهرباء ودهانات — بأسعار واضحة وتوفر محدّث أولًا بأول.
          </p>

          <form
            className="mt-8 flex max-w-xl gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/products", search: { q: search, cat: "" } });
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                maxLength={80}
                placeholder="ابحث عن منتج… مثال: إسمنت، بلاط، كيبل"
                className="h-12 bg-background pr-10 text-base"
                aria-label="بحث عن المنتجات"
              />
            </div>
            <Button type="submit" size="lg" className="h-12">
              بحث
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/products" search={{ q: "", cat: "" }}>
                تصفح المنتجات
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/cart">احجز طلبك</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, title: "مواد مطابقة للمواصفات", text: "منتجات معتمدة من موردين موثوقين" },
          { icon: Truck, title: "تجهيز سريع", text: "نجهّز طلبك قبل موعد الاستلام" },
          { icon: Clock, title: "استلام في وقتك", text: "تختار التاريخ والوقت المناسب لك" },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <item.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-display font-bold">{item.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">أقسام مواد البناء</h2>
            <p className="text-sm text-muted-foreground">اختر القسم لعرض منتجاته</p>
          </div>
          <Link to="/products" search={{ q: "", cat: "" }} className="text-sm font-semibold text-primary hover:underline">
            عرض الكل
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories?.map((cat) => (
            <Link
              key={cat.id}
              to="/products"
              search={{ q: "", cat: cat.slug }}
              className="group relative overflow-hidden rounded-2xl border border-border shadow-card"
            >
              <img
                src={cat.image_url ?? ""}
                alt={cat.name}
                loading="lazy"
                width={800}
                height={600}
                className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-36"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-secondary/90 to-transparent" />
              <span className="absolute bottom-3 right-3 font-display text-sm font-bold text-white">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-6 font-display text-2xl font-bold">منتجات مميزة</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured?.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Contact + location */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold">معلومات التواصل وموقع المحل</h2>
            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 text-primary" />
                <span>
                  <span className="block font-semibold">الهاتف</span>
                  <a href={`tel:${STORE.phone}`} className="text-muted-foreground">
                    {STORE.phoneDisplay}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <span>
                  <span className="block font-semibold">العنوان</span>
                  <span className="text-muted-foreground">{STORE.address}</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-primary" />
                <span>
                  <span className="block font-semibold">أوقات العمل</span>
                  <span className="text-muted-foreground">{STORE.hours}</span>
                </span>
              </li>
            </ul>
            <Button asChild variant="secondary" className="mt-6">
              <a href={STORE.mapUrl} target="_blank" rel="noreferrer">
                فتح الموقع على الخريطة
              </a>
            </Button>
          </div>
          <div className="min-h-64 overflow-hidden rounded-xl border border-border">
            <iframe
              title="موقع المحل"
              src={STORE.mapEmbed}
              loading="lazy"
              className="h-full min-h-64 w-full"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
