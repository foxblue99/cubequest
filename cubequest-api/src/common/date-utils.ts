/**
 * 统一时区工具 — 所有日期/周数计算统一使用 Asia/Shanghai
 * ranking.service.ts 和 tribe-war.service.ts 必须使用这里提供的函数
 */

export function shanghaiNow(): Date {
  const now = new Date();
  const offset = -now.getTimezoneOffset();
  const shanghaiOffset = 480; // UTC+8 in minutes
  return new Date(now.getTime() + (shanghaiOffset - offset) * 60000);
}

export function getShanghaiWeekKey(date?: Date): string {
  const d = date || shanghaiNow();
  // ISO 8601 week number
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const weekNum = Math.ceil(((target.getTime() - firstThursday.getTime()) / 86400000 + firstThursday.getUTCDay() + 1) / 7);
  return `${d.getFullYear()}-W${weekNum}`;
}

export function getShanghaiWeekStart(date?: Date): Date {
  const d = date || shanghaiNow();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.getFullYear(), d.getMonth(), diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * 解析 weekKey → { start, end } (上海时区)
 */
export function parseWeekKeyRange(weekKey: string): { start: Date; end: Date } {
  const [year, week] = weekKey.split('-W').map(Number);
  const jan4 = new Date(year, 0, 4);
  const start = new Date(jan4.getTime() + (week - 1) * 7 * 86400000);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 7 * 86400000);
  return { start, end };
}
