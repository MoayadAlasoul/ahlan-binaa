import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STORE } from "@/lib/store-info";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: `دخول الإدارة | ${STORE.name}` },
      { name: "description", content: "تسجيل دخول فريق المتجر لإدارة الطلبات والمنتجات." },
      { property: "og:title", content: `دخول الإدارة | ${STORE.name}` },
      { property: "og:description", content: "لوحة تحكم إدارة الطلبات والمنتجات." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || password.length < 6) {
      toast.error("الرجاء إدخال بريد إلكتروني صحيح وكلمة مرور من 6 أحرف على الأقل");
      return;
    }
    setLoading(true);

    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { emailRedirectTo: `${window.location.origin}/auth` },
          });

    setLoading(false);

    if (result.error) {
      toast.error("تعذّر تسجيل الدخول", { description: result.error.message });
      return;
    }
    if (!result.data.session) {
      toast.success("تم إنشاء الحساب", { description: "الرجاء تأكيد البريد الإلكتروني ثم تسجيل الدخول." });
      setMode("signin");
      return;
    }

    await supabase.rpc("claim_admin_if_none");
    toast.success("تم تسجيل الدخول");
    navigate({ to: "/admin" });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-border bg-card p-7 shadow-card">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <h1 className="mt-3 font-display text-2xl font-bold">
          {mode === "signin" ? "دخول الإدارة" : "إنشاء حساب إداري"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          هذه الصفحة مخصصة لفريق المتجر فقط. العملاء لا يحتاجون إلى حساب للحجز.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              maxLength={255}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              maxLength={72}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "جاري المعالجة…" : mode === "signin" ? "تسجيل الدخول" : "إنشاء الحساب"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-sm text-primary hover:underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "ليس لديك حساب؟ إنشاء حساب" : "لديك حساب؟ تسجيل الدخول"}
        </button>
      </div>
    </div>
  );
}
