'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, Sparkles, MessageCircle, Mail, Globe, Check, X, Heart, Share2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ensureLineLogin, getLineProfile, initLiff } from '@/lib/liff';
import {
  upsertUserFromLineProfile,
  createFriendCampaign,
  createFanCampaign,
} from '@/lib/actions';
import type { CampaignCategory } from '@/lib/supabase/types';

// LIFFログインリダイレクト後の state 復元キー
const CB_STATE_KEY = 'cb_campaign_state';

// Theme configurations for categories
const FRIEND_THEMES = {
  birthday: { id: 'birthday', label: '誕生日', emoji: '🎂', gradient: 'from-pink-500 to-rose-400' },
  wedding: { id: 'wedding', label: '結婚', emoji: '💍', gradient: 'from-purple-500 to-pink-400' },
  baby: { id: 'baby', label: '出産', emoji: '👶', gradient: 'from-blue-500 to-cyan-400' },
  graduation: { id: 'graduation', label: '卒業', emoji: '🎓', gradient: 'from-green-500 to-emerald-400' },
  retirement: { id: 'retirement', label: '退職', emoji: '🌟', gradient: 'from-orange-500 to-yellow-400' },
  thanks: { id: 'thanks', label: 'ありがとう', emoji: '🙏', gradient: 'from-indigo-500 to-purple-400' },
};

type PageMode = 'modeSelect' | 'friendMode' | 'fanMode';
type FriendStep = 0 | 1 | 2 | 3;
type FanStep = 0 | 1 | 2;

interface FriendFormData {
  theme: string;
  recipient: string;
  wish: string;
  wishPrice: string;
  message: string;
}

interface FanFormData {
  accountConnected: boolean;
  lineUserId?: string;
  lineDisplayName?: string;
  linePictureUrl?: string;
  activityName: string;
  genre: string;
  snsLink: string;
  wishItem: string;
  targetAmount: string;
  productUrl: string;
  fanMessage: string;
}

export default function CampaignNewPage() {
  const router = useRouter();
  const [pageMode, setPageMode] = useState<PageMode>('modeSelect');
  const [friendStep, setFriendStep] = useState<FriendStep>(0);
  const [fanStep, setFanStep] = useState<FanStep>(0);

  const [friendForm, setFriendForm] = useState<FriendFormData>({
    theme: 'birthday',
    recipient: '',
    wish: '',
    wishPrice: '',
    message: '',
  });

  const [fanForm, setFanForm] = useState<FanFormData>({
    accountConnected: false,
    activityName: '',
    genre: '',
    snsLink: '',
    wishItem: '',
    targetAmount: '',
    productUrl: '',
    fanMessage: '',
  });

  const [lineLoading, setLineLoading] = useState(false);
  const [lineError, setLineError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * ファンモード用: 企画者本人の LINE プロファイルを取得して fanForm に反映。
   *
   * 設計意図:
   *   - ファンモードは「自分宛のキャンペーン」なので、本人のLINE情報を取得する
   *     のは自然。
   *   - 友達モードの受取人は本人が居ないと承認できないため、名前入力＋後から
   *     `/approve` LIFF で受取人本人が承認するフローに分離。
   *
   * リダイレクト後の state 復元:
   *   LINEログインは OAuth リダイレクトでページ全体を遷移させるため、
   *   モード/ステップが消える。前もって sessionStorage に保存しておき、
   *   戻ってきた時に復元する。
   */
  const handleFanLineLogin = async () => {
    setLineError(null);
    setLineLoading(true);
    try {
      const liff = await initLiff();
      if (!liff.isLoggedIn()) {
        // リダイレクト前に現在位置を保存
        sessionStorage.setItem(
          CB_STATE_KEY,
          JSON.stringify({ mode: 'fanMode', step: fanStep })
        );
        await ensureLineLogin(window.location.href);
        return;
      }
      await applyLineProfileToFanForm();
    } catch (err: any) {
      console.error('LINE login error:', err);
      setLineError(err?.message || 'LINE連携に失敗しました');
    } finally {
      setLineLoading(false);
    }
  };

  const applyLineProfileToFanForm = async () => {
    const profile = await getLineProfile();
    if (!profile) return;
    setFanForm((prev) => ({
      ...prev,
      accountConnected: true,
      lineUserId: profile.userId,
      lineDisplayName: profile.displayName,
      linePictureUrl: profile.pictureUrl,
      // 活動名が未入力ならLINE表示名をデフォルトにする
      activityName: prev.activityName || profile.displayName,
    }));
  };

  /**
   * OAuth リダイレクト後の state 復元 + プロファイル反映
   *
   * 友達モード/ファンモードどちらでも、リダイレクト直前に sessionStorage に
   * モード・ステップ・フォーム内容を保存しているので、復元する。
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('code')) return; // 通常アクセスなら何もしない

    const raw = sessionStorage.getItem(CB_STATE_KEY);
    let restoredMode: PageMode | null = null;
    if (raw) {
      try {
        const saved = JSON.parse(raw) as {
          mode: PageMode;
          step: number;
          friendForm?: FriendFormData;
          fanForm?: FanFormData;
        };
        restoredMode = saved.mode;
        if (saved.mode === 'fanMode') {
          setPageMode('fanMode');
          setFanStep((saved.step as FanStep) ?? 0);
          if (saved.fanForm) setFanForm(saved.fanForm);
        } else if (saved.mode === 'friendMode') {
          setPageMode('friendMode');
          setFriendStep((saved.step as FriendStep) ?? 0);
          if (saved.friendForm) setFriendForm(saved.friendForm);
        }
      } catch {
        /* ignore */
      }
      sessionStorage.removeItem(CB_STATE_KEY);
    }

    // LIFF 初期化 → プロファイル反映 (ファンモード時のみフォーム反映)
    (async () => {
      setLineLoading(true);
      try {
        await initLiff();
        if (restoredMode === 'fanMode') {
          await applyLineProfileToFanForm();
        }
        // URL からクエリ除去
        window.history.replaceState({}, '', '/campaign/new');
      } catch (err: any) {
        console.error('LIFF restore error:', err);
      } finally {
        setLineLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 友達モードの公開処理
   *
   * 流れ:
   *   1. 企画者本人のLINE認証を確保（未ログインならリダイレクト＋state保存）
   *   2. LINE プロファイルを Supabase users に upsert → organizer_id を取得
   *   3. createFriendCampaign を呼んで campaign + approval(token) を作成
   *   4. share ページに token 付きで遷移
   */
  const handleFriendSubmit = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      // 1. 企画者の LINE 認証
      const liff = await initLiff();
      if (!liff.isLoggedIn()) {
        sessionStorage.setItem(
          CB_STATE_KEY,
          JSON.stringify({
            mode: 'friendMode',
            step: friendStep,
            friendForm,
          })
        );
        await ensureLineLogin(window.location.href);
        return;
      }

      const profile = await getLineProfile();
      if (!profile) throw new Error('LINEプロファイルを取得できませんでした');

      // 2. ユーザー upsert
      const userRes = await upsertUserFromLineProfile({
        lineUserId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      });
      if (!userRes.success) throw new Error(userRes.error || 'ユーザー作成に失敗しました');

      // 3. キャンペーン作成
      const result = await createFriendCampaign({
        organizerId: userRes.userId,
        recipientName: friendForm.recipient,
        category: friendForm.theme as CampaignCategory,
        wishItem: friendForm.wish || undefined,
        wishPrice: friendForm.wishPrice ? Number(friendForm.wishPrice) : undefined,
        description: friendForm.message,
      });

      if (!result.success) throw new Error(result.error || 'キャンペーン作成に失敗しました');

      // 4. share ページに遷移（approvalToken は受取人へのリンク生成に使う）
      router.push(
        `/campaign/${result.id}/share?token=${encodeURIComponent(result.approvalToken)}&mode=friend`
      );
    } catch (err: any) {
      console.error('Friend submit error:', err);
      setSubmitError(err?.message || '公開処理に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * ファンモードの公開処理
   *
   * 流れ:
   *   1. LINE プロファイル必須（fanForm に既に保持済みのはず）
   *   2. users upsert → organizer_id 取得
   *   3. createFanCampaign（active 状態で作成）
   *   4. share ページへ遷移
   */
  const handleFanSubmit = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (!fanForm.lineUserId || !fanForm.lineDisplayName) {
        throw new Error('Step1 で LINE 連携を完了してください');
      }

      const userRes = await upsertUserFromLineProfile({
        lineUserId: fanForm.lineUserId,
        displayName: fanForm.lineDisplayName,
        pictureUrl: fanForm.linePictureUrl,
      });
      if (!userRes.success) throw new Error(userRes.error || 'ユーザー作成に失敗しました');

      const result = await createFanCampaign({
        organizerId: userRes.userId,
        category: 'birthday' as CampaignCategory, // ファンモードはカテゴリ未選択なのでデフォルト
        wishItem: fanForm.wishItem,
        wishPrice: fanForm.targetAmount ? Number(fanForm.targetAmount) : undefined,
        description: fanForm.fanMessage,
      });

      if (!result.success) throw new Error(result.error || 'キャンペーン作成に失敗しました');

      router.push(
        `/campaign/${result.id}/share?mode=fan&slug=${encodeURIComponent(result.slug)}`
      );
    } catch (err: any) {
      console.error('Fan submit error:', err);
      setSubmitError(err?.message || '公開処理に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFriendNext = () => {
    if (friendStep < 3) setFriendStep((friendStep + 1) as FriendStep);
  };

  const handleFriendPrev = () => {
    if (friendStep > 0) setFriendStep((friendStep - 1) as FriendStep);
  };

  const handleFanNext = () => {
    if (fanStep < 2) setFanStep((fanStep + 1) as FanStep);
  };

  const handleFanPrev = () => {
    if (fanStep > 0) setFanStep((fanStep - 1) as FanStep);
  };

  const themes = Object.values(FRIEND_THEMES);

  // ===== Mode Selection =====
  if (pageMode === 'modeSelect') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center">
          <button onClick={() => router.back()} className="text-sm text-gray-500">
            ← 戻る
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-gray-700">モードを選ぶ</span>
          <div className="w-12" />
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-md mx-auto w-full">
          <h2 className="text-xl font-bold text-gray-900 mb-2">どちらで使いますか？</h2>
          <p className="text-sm text-gray-400 mb-8 text-center">あとから変更もできます</p>
          <div className="space-y-4 w-full">
            <button
              onClick={() => {
                setPageMode('friendMode');
                setFriendStep(0);
              }}
              className="w-full bg-white rounded-2xl p-5 border-2 border-gray-100 hover:border-pink-300 hover:shadow-lg transition-all text-left"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">👫</div>
                <div>
                  <div className="font-bold text-gray-900 mb-1">友達モード</div>
                  <div className="text-sm text-gray-500">友達へのお祝いを企画する</div>
                  <div className="text-xs text-pink-600 font-semibold mt-2">
                    受取人がLINEで承認 → 仲間に共有 → eギフト自動送信
                  </div>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setPageMode('fanMode');
                setFanStep(0);
              }}
              className="w-full bg-white rounded-2xl p-5 border-2 border-gray-100 hover:border-violet-300 hover:shadow-lg transition-all text-left"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">🎤</div>
                <div>
                  <div className="font-bold text-gray-900 mb-1">ファンモード</div>
                  <div className="text-sm text-gray-500">自分宛のページを作ってSNSで告知</div>
                  <div className="text-xs text-violet-600 font-semibold mt-2">
                    自分でページ作成 → SNSで告知 → ファンから受け取る
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== Friend Mode =====
  if (pageMode === 'friendMode') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center">
          <button
            onClick={() => (friendStep > 0 ? setFriendStep((friendStep - 1) as FriendStep) : setPageMode('modeSelect'))}
            className="text-sm text-gray-500"
          >
            ← 戻る
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-gray-700">👫 友達モード</span>
          <div className="w-12" />
        </nav>

        {/* Progress Bar */}
        <div className="flex gap-1.5 px-6 pt-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i <= friendStep ? 'bg-gradient-to-r from-pink-500 to-rose-400' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="flex-1 px-6 py-6 max-w-md mx-auto w-full overflow-y-auto">
          {/* Step 0: Category */}
          {friendStep === 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">何のお祝い？</h2>
              <p className="text-sm text-gray-400 mb-6">タップで選んでね</p>
              <div className="grid grid-cols-3 gap-3">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setFriendForm({ ...friendForm, theme: t.id })}
                    className={`p-4 rounded-2xl border-2 transition-all text-center hover:scale-105 ${
                      friendForm.theme === t.id
                        ? 'border-pink-400 bg-pink-50 shadow-md'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="text-2xl mb-1">{t.emoji}</div>
                    <div className="text-xs font-semibold text-gray-700">{t.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Recipient */}
          {friendStep === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">誰をお祝いする？</h2>
              <p className="text-sm text-gray-400 mb-6">お祝いする人の名前（ニックネームでOK）</p>

              <input
                value={friendForm.recipient}
                onChange={(e) => setFriendForm({ ...friendForm, recipient: e.target.value })}
                placeholder="例：ゆきのちゃん"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 mb-4"
              />

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <div className="text-xs text-amber-700 leading-relaxed">
                  <span className="font-semibold">🔒 この後のながれ</span>
                  <br />
                  公開後、<b>LINE招待リンク</b>を本人に送ります。本人がLINEで承認するとキャンペーンが有効化され、
                  eギフトが本人に確実に届くようになります（なりすまし防止）。
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Wish Item */}
          {friendStep === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">何を贈りたい？</h2>
              <p className="text-sm text-gray-400 mb-6">決まってなくてもOK！</p>
              <input
                value={friendForm.wish}
                onChange={(e) => setFriendForm({ ...friendForm, wish: e.target.value })}
                placeholder="例：LOUIS VUITTON ネヴァーフル"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 mb-3"
              />
              <input
                value={friendForm.wishPrice}
                onChange={(e) => setFriendForm({ ...friendForm, wishPrice: e.target.value })}
                placeholder="目安の金額（任意）例：280000"
                type="number"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 mb-3"
              />
              <p className="text-xs text-gray-400">
                💡 目安金額はあくまで参考。集まった分だけeギフトとして届きます。
              </p>
            </div>
          )}

          {/* Step 3: Message */}
          {friendStep === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">みんなへのひとこと</h2>
              <p className="text-sm text-gray-400 mb-6">共有する時に見えるメッセージ</p>
              <textarea
                value={friendForm.message}
                onChange={(e) => setFriendForm({ ...friendForm, message: e.target.value })}
                rows={4}
                placeholder="例：ゆきのちゃんの20歳をみんなでお祝いしよう！金額は気持ちでOKです🎉"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
              />
            </div>
          )}
        </div>

        <div className="px-6 pb-8 max-w-md mx-auto w-full">
          {friendStep < 3 ? (
            <button
              onClick={handleFriendNext}
              className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-pink-500 to-rose-400 text-white hover:shadow-lg transition-all"
            >
              次へ
            </button>
          ) : (
            <>
              {submitError && (
                <div className="text-xs text-red-500 mb-2 px-1">{submitError}</div>
              )}
              <button
                onClick={handleFriendSubmit}
                disabled={submitting || !friendForm.recipient}
                className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-pink-500 to-rose-400 text-white hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> 送信中...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> 承認リクエストを送る</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ===== Fan Mode =====
  if (pageMode === 'fanMode') {
    const fanSteps = [
      // Step 0: Account Registration
      <div key={0}>
        <h2 className="text-xl font-bold text-gray-900 mb-1">アカウント登録</h2>
        <p className="text-sm text-gray-400 mb-6">LINE連携でカンタン登録</p>

        <button
          onClick={handleFanLineLogin}
          disabled={lineLoading || fanForm.accountConnected}
          className="w-full bg-green-500 text-white rounded-2xl py-3.5 font-bold flex items-center justify-center gap-2 mb-3 hover:bg-green-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {lineLoading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> LINE連携中...</>
          ) : fanForm.accountConnected ? (
            <><Check className="w-5 h-5" /> LINE連携済み</>
          ) : (
            <><MessageCircle className="w-5 h-5" /> LINEで登録</>
          )}
        </button>

        {lineError && (
          <div className="text-xs text-red-500 mb-3 px-1">{lineError}</div>
        )}

        {fanForm.accountConnected && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center overflow-hidden">
                {fanForm.linePictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fanForm.linePictureUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Check className="w-4 h-4 text-green-600" />
                )}
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{fanForm.lineDisplayName}</div>
                <div className="text-xs text-green-600">LINE連携済み</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mt-3">
          <div className="text-xs text-blue-700">
            🔒 LINEアカウントはログインと本人確認のみに使用し、ファンには公開されません。eギフトの受取もLINE経由で届きます。
          </div>
        </div>
      </div>,

      // Step 1: Public Profile
      <div key={1}>
        <h2 className="text-xl font-bold text-gray-900 mb-1">公開プロフィール</h2>
        <p className="text-sm text-gray-400 mb-6">ファンに見える情報です</p>

        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          活動名 <span className="text-pink-500">*必須</span>
        </label>
        <input
          placeholder="例：星野ひなた"
          value={fanForm.activityName}
          onChange={(e) => setFanForm({ ...fanForm, activityName: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-300 mb-4"
        />

        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          ジャンル / ひとこと <span className="text-gray-400">任意</span>
        </label>
        <input
          placeholder="例：歌い手 / 配信者"
          value={fanForm.genre}
          onChange={(e) => setFanForm({ ...fanForm, genre: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-300 mb-4"
        />

        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          SNSリンク <span className="text-gray-400">任意</span>
        </label>
        <input
          placeholder="例：https://x.com/hinata_music"
          value={fanForm.snsLink}
          onChange={(e) => setFanForm({ ...fanForm, snsLink: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-300 mb-4"
        />
      </div>,

      // Step 2: Wish Item & Message
      <div key={2}>
        <h2 className="text-xl font-bold text-gray-900 mb-1">何が欲しい？</h2>
        <p className="text-sm text-gray-400 mb-6">ファンに見えるウィッシュアイテム</p>

        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          欲しいもの <span className="text-pink-500">*必須</span>
        </label>
        <input
          placeholder="例：配信用マイク SHURE MV7+"
          value={fanForm.wishItem}
          onChange={(e) => setFanForm({ ...fanForm, wishItem: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-300 mb-4"
        />

        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          目安の金額 <span className="text-gray-400">任意</span>
        </label>
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
          <input
            placeholder="例：45000"
            value={fanForm.targetAmount}
            onChange={(e) => setFanForm({ ...fanForm, targetAmount: e.target.value })}
            type="number"
            className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </div>

        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          商品URL <span className="text-gray-400">任意</span>
        </label>
        <input
          placeholder="例：https://amazon.co.jp/dp/..."
          value={fanForm.productUrl}
          onChange={(e) => setFanForm({ ...fanForm, productUrl: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-300 mb-4"
        />

        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          ファンへのメッセージ <span className="text-pink-500">*必須</span>
        </label>
        <textarea
          placeholder="例：いつも応援ありがとうございます！"
          value={fanForm.fanMessage}
          onChange={(e) => setFanForm({ ...fanForm, fanMessage: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
        />
      </div>,
    ];

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center">
          <button
            onClick={() => (fanStep > 0 ? setFanStep((fanStep - 1) as FanStep) : setPageMode('modeSelect'))}
            className="text-sm text-gray-500"
          >
            ← 戻る
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-gray-700">🎤 ファンモード</span>
          <div className="w-12" />
        </nav>

        {/* Progress Bar */}
        <div className="flex gap-1.5 px-6 pt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i <= fanStep ? 'bg-gradient-to-r from-violet-500 to-purple-400' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="flex-1 px-6 py-6 max-w-md mx-auto w-full overflow-y-auto">{fanSteps[fanStep]}</div>

        <div className="px-6 pb-8 max-w-md mx-auto w-full">
          {fanStep < 2 ? (
            <button
              onClick={handleFanNext}
              className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-violet-500 to-purple-400 text-white hover:shadow-lg transition-all"
            >
              次へ
            </button>
          ) : (
            <>
              {submitError && (
                <div className="text-xs text-red-500 mb-2 px-1">{submitError}</div>
              )}
              <button
                onClick={handleFanSubmit}
                disabled={submitting || !fanForm.accountConnected || !fanForm.wishItem}
                className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-violet-500 to-purple-400 text-white hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> 送信中...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> ページを公開する</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
