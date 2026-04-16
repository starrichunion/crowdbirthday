'use server';

import { createServiceClient } from '@/lib/supabase/server';

/**
 * アプリ内エラーロガー (Sentry 代替)
 *
 * 使い方:
 *   try {
 *     ...
 *   } catch (err) {
 *     await logError('stripe_webhook', err, { eventId, campaignId });
 *     throw err;  // 必要に応じて再 throw
 *   }
 *
 * 失敗しても throw せず、console.error にフォールバックする（ロガー自身で
 * アプリを落とさないため）。
 */
export async function logError(
  source: string,
  error: unknown,
  context?: Record<string, any>,
  options?: { level?: 'error' | 'warn' | 'info'; userId?: string; url?: string; userAgent?: string }
): Promise<void> {
  try {
    const sb = createServiceClient();
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? (error.stack || null) : null;
    await sb.from('error_logs' as any).insert([
      {
        source,
        level: options?.level ?? 'error',
        message: message.slice(0, 2000),
        stack: stack ? stack.slice(0, 8000) : null,
        context: context ?? null,
        user_id: options?.userId ?? null,
        url: options?.url ?? null,
        user_agent: options?.userAgent ?? null,
      },
    ]);
  } catch (e) {
    console.error('[logger] failed to persist error log:', e);
    console.error('[logger] original error was:', error);
  }
}

export async function logInfo(source: string, message: string, context?: Record<string, any>): Promise<void> {
  try {
    const sb = createServiceClient();
    await sb.from('error_logs' as any).insert([
      { source, level: 'info', message: message.slice(0, 2000), context: context ?? null },
    ]);
  } catch (e) {
    console.error('[logger] failed to persist info log:', e);
  }
}
