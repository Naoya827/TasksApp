import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const PRIORITY_LABELS: Record<string, string> = {
  EMERGENCY: "緊急",
  HIGH: "高",
  MIDDLE: "中",
  LOW: "低",
  SOMEDAY: "いつか",
};

export const PRIORITY_COLORS: Record<string, string> = {
  EMERGENCY: "bg-red-100 text-red-700 border-red-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  MIDDLE: "bg-yellow-100 text-yellow-700 border-yellow-200",
  LOW: "bg-blue-100 text-blue-700 border-blue-200",
  SOMEDAY: "bg-slate-100 text-slate-600 border-slate-200",
};

export const STATUS_LABELS: Record<string, string> = {
  INBOX: "誰かがやらなきゃ",
  ASSIGNED: "やる人決定",
  DONE: "お疲れ様",
  ARCHIVED: "過去の履歴",
};

export const COLUMN_COLORS: Record<string, string> = {
  INBOX: "border-slate-300 bg-slate-50",
  ASSIGNED: "border-indigo-300 bg-indigo-50",
  DONE: "border-emerald-300 bg-emerald-50",
  ARCHIVED: "border-gray-300 bg-gray-50",
};
