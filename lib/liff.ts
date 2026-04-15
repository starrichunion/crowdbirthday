/**
 * LIFF (LINE Front-end Framework) Helper
 *
 * クライアントサイドのみで動作する LIFF SDK を遅延ロードし、
 * ログイン / プロファイル取得 / shareTargetPicker を扱うユーティリティ。
 *
 * 環境変数:
 *   NEXT_PUBLIC_LIFF_ID - LIFF アプリ ID
 */

let liffInstance: any = null;
let initPromise: Promise<any> | null = null;

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

/**
 * LIFF を初期化（既に初期化済みならキャッシュを返す）
 */
export async function initLiff(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('LIFF can only be initialized on the client');
  }

  if (liffInstance) return liffInstance;
  if (initPromise) return initPromise;

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) {
    throw new Error('NEXT_PUBLIC_LIFF_ID is not set');
  }

  initPromise = (async () => {
    const liffModule = await import('@line/liff');
    const liff = liffModule.default;
    await liff.init({ liffId });
    liffInstance = liff;
    return liff;
  })();

  return initPromise;
}

/**
 * LINE にログイン（既にログイン済みならスキップ）
 */
export async function ensureLineLogin(redirectUri?: string): Promise<void> {
  const liff = await initLiff();
  if (!liff.isLoggedIn()) {
    liff.login(redirectUri ? { redirectUri } : undefined);
  }
}

/**
 * ログイン済みユーザーの LINE プロファイルを取得
 */
export async function getLineProfile(): Promise<LineProfile | null> {
  const liff = await initLiff();
  if (!liff.isLoggedIn()) return null;
  const profile = await liff.getProfile();
  return {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
    statusMessage: profile.statusMessage,
  };
}

/**
 * LIFF 環境で動作しているかを判定（LINE アプリ内 or 外部ブラウザ）
 */
export async function isInLineApp(): Promise<boolean> {
  const liff = await initLiff();
  return liff.isInClient();
}

/**
 * shareTargetPicker で LINE 友達に招待メッセージを送信
 *
 * @param message 送信するテキストメッセージ
 * @param url 招待リンク (approval URL)
 */
export async function shareCampaignInvite(
  recipientName: string,
  campaignTitle: string,
  approvalUrl: string
): Promise<boolean> {
  const liff = await initLiff();

  if (!liff.isApiAvailable('shareTargetPicker')) {
    // LIFF 外ブラウザ等で shareTargetPicker が使えない場合は URL を返すだけ
    return false;
  }

  const messages = [
    {
      type: 'text',
      text:
        `🎁 ${recipientName}さんへのお祝いに招待されました！\n\n` +
        `「${campaignTitle}」\n\n` +
        `みんなで ${recipientName}さんをお祝いしましょう！\n` +
        `下記リンクから参加できます：\n${approvalUrl}`,
    },
  ];

  const result = await liff.shareTargetPicker(messages);
  return !!result;
}

/**
 * LIFF を明示的に閉じる（LINE アプリ内の場合）
 */
export async function closeLiff(): Promise<void> {
  const liff = await initLiff();
  if (liff.isInClient()) {
    liff.closeWindow();
  }
}
