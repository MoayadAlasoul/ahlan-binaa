export const STORE = {
  name: "مؤسسة البناء المتين",
  tagline: "لمواد البناء ومستلزمات المقاولات",
  phone: "0555123456",
  phoneDisplay: "0555 123 456",
  whatsappNote: "الاتصال خلال أوقات العمل",
  address: "طريق الملك عبدالعزيز، حي الصناعية، الرياض",
  hours: "السبت - الخميس: 7 صباحًا - 9 مساءً | الجمعة: 4 مساءً - 9 مساءً",
  mapUrl: "https://maps.google.com/?q=24.7136,46.6753",
  mapEmbed:
    "https://www.google.com/maps?q=24.7136,46.6753&hl=ar&z=14&output=embed",
};

export const ORDER_STATUSES = [
  { key: "received", label: "تم استلام الطلب" },
  { key: "confirmed", label: "تم تأكيد الطلب" },
  { key: "preparing", label: "جاري تجهيز الطلب" },
  { key: "ready", label: "الطلب جاهز للاستلام" },
  { key: "picked_up", label: "تم الاستلام" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["key"];

export function statusLabel(status: string) {
  return ORDER_STATUSES.find((s) => s.key === status)?.label ?? status;
}

export function statusIndex(status: string) {
  const i = ORDER_STATUSES.findIndex((s) => s.key === status);
  return i < 0 ? 0 : i;
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
