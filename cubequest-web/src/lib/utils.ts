import { clsx, type ClassValue } from "clsx";
// Simple classname utility (inline to avoid extra dep)
function clsxImpl(...inputs: ClassValue[]): string {
  return inputs
    .filter(Boolean)
    .map((i) => {
      if (typeof i === "string") return i;
      if (Array.isArray(i)) return clsxImpl(...i);
      if (typeof i === "object") {
        return Object.entries(i as Record<string, unknown>)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(" ");
      }
      return "";
    })
    .join(" ");
}

export { clsxImpl as cn };

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("zh-CN");
}

export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return formatDate(dateStr);
}

export function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    BEGINNER: "零基础入门",
    CFOP_BASIC: "CFOP 基础",
    SUB30: "30秒突破",
    SUB20: "20秒突破",
    F2L: "F2L 专项",
    OLL: "OLL 专项",
    PLL: "PLL 专项",
  };
  return map[category] || category;
}

export function getFormulaCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    LBL: "层先法",
    CROSS: "十字",
    F2L: "F2L",
    OLL: "OLL",
    PLL: "PLL",
    ADVANCED: "高级",
  };
  return map[category] || category;
}

export function getEventStatusLabel(status: string): string {
  const map: Record<string, string> = {
    UPCOMING: "即将开始",
    REGISTERING: "报名中",
    ONGOING: "进行中",
    FINISHED: "已结束",
    CANCELLED: "已取消",
  };
  return map[status] || status;
}

export function getEventStatusColor(status: string): string {
  const map: Record<string, string> = {
    UPCOMING: "bg-blue-500/20 text-blue-400",
    REGISTERING: "bg-green-500/20 text-green-400",
    ONGOING: "bg-orange-500/20 text-orange-400",
    FINISHED: "bg-slate-500/20 text-slate-400",
    CANCELLED: "bg-red-500/20 text-red-400",
  };
  return map[status] || "bg-slate-500/20 text-slate-400";
}
