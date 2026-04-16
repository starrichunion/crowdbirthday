/**
 * OGP/メタタグスクレイパー
 *
 * GET /api/og-preview?url=https://...
 *
 * 返却:
 *   { title?: string; description?: string; image?: string; siteName?: string;
 *     url: string; cached?: boolean }
 *
 * 設計意図:
 *   - ブラウザから直接外部URLを fetch すると CORS で失敗するため、サーバーで取得
 *     して JSON で返す。
 *   - 同じURLが繰り返し参照されることを想定し、Next.js の fetch revalidate と、
 *     インメモリ LRU の二段構えでキャッシュ。
 *   - Amazon は OGP が貧弱なので、`<img id="landingImage" data-old-hires="...">`
 *     等の既知パターンも拾うフォールバックを入れる。
 *   - HTML サイズの暴走を防ぐため、レスポンスは先頭 256KB のみ取得する。
 */

import { NextRequest, NextResponse } from 'next/server';

// Edge ではなく Node ランタイムで動かす (TextDecoder の挙動を統一するため)
export const runtime = 'nodejs';
// 6時間 ISR
export const revalidate = 21600;

interface OgPreview {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
  cached?: boolean;
}

const MEMO = new Map<string, { value: OgPreview; expires: number }>();
const MEMO_TTL_MS = 6 * 60 * 60 * 1000; // 6h
const MEMO_MAX = 256;

function memoGet(key: string): OgPreview | null {
  const hit = MEMO.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    MEMO.delete(key);
    return null;
  }
  return hit.value;
}

function memoSet(key: string, value: OgPreview) {
  if (MEMO.size >= MEMO_MAX) {
    // 単純な LRU: 古い方から1件削除
    const oldestKey = MEMO.keys().next().value;
    if (oldestKey) MEMO.delete(oldestKey);
  }
  MEMO.set(key, { value, expires: Date.now() + MEMO_TTL_MS });
}

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function abs(base: string, maybe?: string | null): string | undefined {
  if (!maybe) return undefined;
  try {
    return new URL(maybe, base).toString();
  } catch {
    return undefined;
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function pickMeta(html: string, attrs: string[]): string | undefined {
  for (const attr of attrs) {
    // <meta property="og:title" content="...">
    const re = new RegExp(
      `<meta[^>]+(?:property|name)\\s*=\\s*['\"]${attr}['\"][^>]*>`,
      'i'
    );
    const m = html.match(re);
    if (m) {
      const cm = m[0].match(/content\s*=\s*['"]([^'"]+)['"]/i);
      if (cm) return decodeEntities(cm[1]).trim();
    }
  }
  return undefined;
}

function pickTitleTag(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1]).trim() : undefined;
}

/**
 * Amazon ページ用のフォールバック画像抽出。
 * 通常の og:image が空 / 非 og 画像の場合に商品画像URLを抜き出す。
 */
function pickAmazonImage(html: string): string | undefined {
  // 1. landingImage の data-old-hires (最高解像度)
  const m1 = html.match(
    /id=["']landingImage["'][^>]*data-old-hires=["']([^"']+)["']/i
  );
  if (m1) return m1[1];
  // 2. landingImage の src
  const m2 = html.match(/id=["']landingImage["'][^>]*src=["']([^"']+)["']/i);
  if (m2) return m2[1];
  // 3. data-a-dynamic-image 内の最初のURL
  const m3 = html.match(/data-a-dynamic-image=["']\{\s*&quot;([^&]+)/i);
  if (m3) return m3[1];
  return undefined;
}

async function fetchPartialHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      // 多くのサイトは UA を見て返すコンテンツを変える
      'User-Agent':
        'Mozilla/5.0 (compatible; CrowdBirthdayBot/1.0; +https://crowdbirthday.com)',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ja,en;q=0.7',
    },
    // Next.js データキャッシュ
    next: { revalidate: 21600 },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`Upstream returned ${res.status}`);
  }

  // 先頭 256KB だけ読む。OGP は大体 <head> 内なので十分。
  const reader = res.body?.getReader();
  if (!reader) return await res.text();
  const chunks: Uint8Array[] = [];
  let total = 0;
  const LIMIT = 256 * 1024;
  while (total < LIMIT) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  try {
    await reader.cancel();
  } catch {
    /* ignore */
  }
  // 文字コード判定は雑だが、meta charset があれば従う
  const head = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  // とりあえず utf-8 で復号 → meta charset があれば再復号
  let text = head.toString('utf-8');
  const csm = text.match(/charset=["']?([\w-]+)/i);
  if (csm) {
    const cs = csm[1].toLowerCase();
    if (cs !== 'utf-8' && cs !== 'utf8') {
      try {
        const decoder = new TextDecoder(cs as string);
        text = decoder.decode(head);
      } catch {
        /* keep utf-8 */
      }
    }
  }
  return text;
}

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get('url');
  if (!target || !isHttpUrl(target)) {
    return NextResponse.json(
      { error: 'Valid http(s) url query is required' },
      { status: 400 }
    );
  }

  // インメモリキャッシュ
  const cached = memoGet(target);
  if (cached) {
    return NextResponse.json({ ...cached, cached: true });
  }

  try {
    const html = await fetchPartialHtml(target);

    const title =
      pickMeta(html, ['og:title', 'twitter:title']) || pickTitleTag(html);
    const description = pickMeta(html, [
      'og:description',
      'twitter:description',
      'description',
    ]);
    let image = pickMeta(html, [
      'og:image',
      'og:image:url',
      'og:image:secure_url',
      'twitter:image',
      'twitter:image:src',
    ]);
    const siteName =
      pickMeta(html, ['og:site_name', 'application-name']) ||
      new URL(target).hostname;

    // Amazon フォールバック
    if (!image && /amazon\.[a-z.]+/i.test(target)) {
      image = pickAmazonImage(html);
    }

    const result: OgPreview = {
      url: target,
      title,
      description,
      image: abs(target, image),
      siteName,
    };

    memoSet(target, result);

    return NextResponse.json(result, {
      headers: {
        // ブラウザ側でも 6h キャッシュ
        'Cache-Control': 'public, max-age=21600, s-maxage=21600',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        url: target,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch preview',
      },
      { status: 502 }
    );
  }
}
