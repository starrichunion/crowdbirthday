import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CampaignCategory } from './supabase/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: 'JPY' | 'USD' | 'EUR' = 'JPY',
  includeSymbol = true
): string {
  const formatter = new Intl.NumberFormat(
    currency === 'JPY' ? 'ja-JP' : currency === 'EUR' ? 'de-DE' : 'en-US',
    {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }
  );

  return formatter.format(amount / (currency === 'JPY' ? 1 : 100));
}

export function formatCurrencyCompact(
  amount: number,
  currency: 'JPY' | 'USD' | 'EUR' = 'JPY'
): string {
  // For display in lists, use more compact format
  if (currency === 'JPY') {
    if (amount >= 10000) {
      return `¥${(amount / 10000).toFixed(1)}万`;
    }
    return `¥${amount.toLocaleString('ja-JP')}`;
  }

  const absAmount = Math.abs(amount / 100);
  if (absAmount >= 1000) {
    return `${currency === 'EUR' ? '€' : '$'}${(absAmount / 1000).toFixed(1)}k`;
  }
  return formatCurrency(amount, currency);
}

export function getProgress(raised: number, goal: number): number {
  if (goal === 0) return 0;
  return Math.min(Math.round((raised / goal) * 100), 100);
}

export interface CategoryInfo {
  label: string;
  emoji: string;
  color: string;
  colorBg: string;
  colorText: string;
}

export function getCategoryInfo(category: CampaignCategory): CategoryInfo {
  const categories: Record<CampaignCategory, CategoryInfo> = {
    birthday: {
      label: 'お誕生日',
      emoji: '🎂',
      color: 'rose',
      colorBg: 'bg-rose-50',
      colorText: 'text-rose-700',
    },
    wedding: {
      label: 'ウェディング',
      emoji: '💍',
      color: 'pink',
      colorBg: 'bg-pink-50',
      colorText: 'text-pink-700',
    },
    baby: {
      label: '出産祝い',
      emoji: '👶',
      color: 'blue',
      colorBg: 'bg-blue-50',
      colorText: 'text-blue-700',
    },
    graduation: {
      label: '卒業祝い',
      emoji: '🎓',
      color: 'purple',
      colorBg: 'bg-purple-50',
      colorText: 'text-purple-700',
    },
    retirement: {
      label: '退職祝い',
      emoji: '🎉',
      color: 'amber',
      colorBg: 'bg-amber-50',
      colorText: 'text-amber-700',
    },
    thanks: {
      label: 'ありがとう',
      emoji: '🙏',
      color: 'green',
      colorBg: 'bg-green-50',
      colorText: 'text-green-700',
    },
  };

  return categories[category];
}

export function getTimeRemaining(deadline: string | null | undefined): string {
  if (!deadline) return '期限なし';

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return '期限切れ';
  if (diffDays === 0) return '本日まで';
  if (diffDays === 1) return '明日まで';
  return `残り${diffDays}日`;
}

export function getTimeRemainingShort(deadline: string | null | undefined): string {
  if (!deadline) return '';

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return '期限切れ';
  if (diffDays === 0) return '本日';
  if (diffDays === 1) return '明日';
  return `${diffDays}日`;
}

export function generateOGPUrl(
  campaignId: string,
  title: string,
  recipientName: string
): string {
  const params = new URLSearchParams({
    title: title || 'CrowdBirthday',
    recipient: recipientName || 'Someone',
  });

  return `${process.env.NEXT_PUBLIC_APP_URL}/api/og?${params.toString()}`;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function truncate(text: string, length: number = 100): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  return d.toLocaleDateString('ja-JP', options);
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  };
  return d.toLocaleDateString('ja-JP', options);
}
