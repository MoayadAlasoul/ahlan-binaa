import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AdminOrders } from "@/components/admin-orders";
import { AdminProducts } from "@/components/admin-products";
import { STORE } from "@/lib/store-info";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `لوحة التحكم | ${STORE.name}` },
      { name: "description", content: "إدارة الطلبات والمنتجات والأسعار وحالة التوفر." },
      { property: "og:title", content: `لوحة التحكم | ${STORE.name}` },
      { property: "og:description", content: "لوحة تحكم إدارة المتجر." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"orders" | "products">("orders");

  const { data: auth, isLoading } = useQuery({
    queryKey: ["admin-access"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return { signedIn: false, isAdmin: false };
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      return {
        signedIn: true,
        isAdmin: (roles ?? []).some((r) => r.role === "admin"),
        email: userData.user.email,
      };
    },
  });

  useEffect(() => {
    if (!isLoading && auth && !auth.signedIn) navigate({ to: "/auth" });
  }, [auth, isLoading, navigate]);

  if (isLoading || !auth) {
    return <p className="py-24 text-center text-muted-foreground">جاري التحقق من الصلاحيات…</p>;
  }

  if (!auth.isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">لا تملك صلاحية الدخول</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          حسابك ليس ضمن مدراء المتجر. تواصل مع مدير النظام لمنحك الصلاحية.
        </p>
        <Button
          className="mt-6"
          variant="outline"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth" });
          }}
        >
          تسجيل الخروج
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground">مرحبًا {auth.email}</p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth" });
          }}
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>

      <div className="mt-6 flex gap-2">
        {(
          [
            { key: "orders", label: "الطلبات" },
            { key: "products", label: "المنتجات" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-5 py-2 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">{tab === "orders" ? <AdminOrders /> : <AdminProducts />}</div>
    </div>
  );
}
