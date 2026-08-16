import { Check } from "lucide-react";
import { ORDER_STATUSES, statusIndex } from "@/lib/store-info";

export function OrderStatusSteps({ status }: { status: string }) {
  const current = statusIndex(status);

  return (
    <ol className="space-y-4">
      {ORDER_STATUSES.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-muted text-muted-foreground"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              {i < ORDER_STATUSES.length - 1 && (
                <span
                  className={`h-8 w-0.5 ${i < current ? "bg-primary" : "bg-border"}`}
                  aria-hidden
                />
              )}
            </div>
            <div className="pt-1.5">
              <p className={`text-sm font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>
                {step.label}
              </p>
              {i === current && (
                <p className="text-xs text-primary">الحالة الحالية</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
