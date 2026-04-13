'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Share2,
  Package,
  Gift,
  CreditCard,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: '1',
    question: 'CrowdBirthdayとは何ですか？',
    answer:
      'CrowdBirthdayは、誕生日、結婚、出産などのお祝い行事に対して、複数の人からギフトを募集するクラウドファンディングサービスです。一人では届かない高額なギフトも、みんなでお祝いして実現できます。',
  },
  {
    id: '2',
    question: '手数料はどのくらいかかりますか？',
    answer:
      '企画者に対して、集まった金額の20%が手数料として差し引かれます。また、決済システム（Stripe）の手数料として約3.6% + 10円がかかります。振込手数料は銀行の規程に基づいて請求されます。',
  },
  {
    id: '3',
    question: '目標金額に達しなかった場合、お金はどうなりますか？',
    answer:
      'CrowdBirthdayはAll or Nothing方式を採用しており、目標金額に達しなかった場合、応援者（サポーター）に全額返金されます。手数料は差し引かれません。',
  },
  {
    id: '4',
    question: 'クレジットカード情報は安全ですか？',
    answer:
      'はい、完全に安全です。当社はStripe決済システムを使用しており、PCI DSSレベル1の国際的なセキュリティ基準に準拠しています。クレジットカード情報は暗号化されて保護されます。',
  },
  {
    id: '5',
    question: 'グローバル配送は可能ですか？',
    answer:
      'はい、190以上の国・地域への配送に対応しています。ただし、配送先によっては追加の配送料金が発生する場合があります。商品ページで確認できます。',
  },
  {
    id: '6',
    question: 'プロフィール情報は公開されますか？',
    answer:
      'プロフィールページは公開されます。ただし、プライバシー設定で公開範囲を限定することができます。メールアドレスなどの個人情報は公開されません。',
  },
];

interface FAQItemComponentProps {
  item: FAQItem;
}

function FAQItemComponent({ item }: FAQItemComponentProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900 text-left">
          {item.question}
        </span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-pink-500 flex-shrink-0 ml-4" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-gray-700 leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-br from-pink-50 via-white to-purple-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            使い方ガイド
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            CrowdBirthdayの利用方法を詳しく説明します。
            企画者も応援者も、簡単な3ステップで始められます。
          </p>
        </div>
      </section>

      {/* For Organizers */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">企画者向け - 3ステップ</h2>
            <p className="section-subtitle">
              ファンディング企画を作成して、みんなでお祝いを届けよう
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white rounded-xl border-2 border-pink-200 p-8 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-6">
                  <Plus className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
                  1. 企画を作成
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  カテゴリ、受取人名、ギフト内容、目標金額を設定するだけ。
                </p>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>✓ 最大5つのギフトオプション</li>
                  <li>✓ 募集期間は最大60日</li>
                  <li>✓ 本人モード/サプライズモード</li>
                </ul>
              </div>
              {/* Arrow */}
              <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-3xl text-pink-300">
                →
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white rounded-xl border-2 border-pink-200 p-8 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-6">
                  <Share2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
                  2. シェア
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  企画ページをSNSや友達にシェア。
                  みんなからのお祝いを集めましょう。
                </p>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>✓ ワンクリックシェア</li>
                  <li>✓ QRコード生成</li>
                  <li>✓ 進捗リアルタイム表示</li>
                </ul>
              </div>
              {/* Arrow */}
              <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-3xl text-pink-300">
                →
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl border-2 border-pink-200 p-8 h-full">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-6">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
                3. 届く
              </h3>
              <p className="text-gray-600 text-center mb-4">
                目標金額に達したら、CrowdBirthdayが商品を購入・配送。
              </p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ 目標達成で自動購入</li>
                <li>✓ グローバル配送対応</li>
                <li>✓ 返金は全額（未達成時）</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* For Contributors */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">応援者向け - 3ステップ</h2>
            <p className="section-subtitle">
              好きなギフト企画を見つけて、お祝いを送ろう
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white rounded-xl border-2 border-purple-200 p-8 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-6">
                  <Gift className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
                  1. ギフトを探す
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  「探す」ページから、応援したいギフトを探します。
                </p>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>✓ カテゴリから検索</li>
                  <li>✓ キーワード検索対応</li>
                  <li>✓ 人気順・期限順ソート</li>
                </ul>
              </div>
              {/* Arrow */}
              <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-3xl text-purple-300">
                →
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white rounded-xl border-2 border-purple-200 p-8 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-6">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
                  2. お祝い金を送信
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  好きな金額を選んで、安全に送信。
                  メッセージも添えられます。
                </p>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>✓ プリセット金額 ¥1,000～</li>
                  <li>✓ カスタム金額対応</li>
                  <li>✓ 匿名送信可能</li>
                </ul>
              </div>
              {/* Arrow */}
              <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-3xl text-purple-300">
                →
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl border-2 border-purple-200 p-8 h-full">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-6">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
                3. ギフト配送
              </h3>
              <p className="text-gray-600 text-center mb-4">
                目標達成後、あなたのお祝いが大切な人に届きます。
              </p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ 配送状況を追跡</li>
                <li>✓ 配信完了通知</li>
                <li>✓ 未達成時は全額返金</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title flex items-center justify-center gap-2">
              <HelpCircle className="w-8 h-8 text-pink-500" />
              よくあるご質問
            </h2>
            <p className="section-subtitle">
              CrowdBirthdayについてのよくあるご質問にお答えします
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item) => (
              <FAQItemComponent key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Info */}
      <section id="pricing" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">料金表</h2>
            <p className="section-subtitle">
              企画者様向けの料金体系です
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Fee 1 */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-2 font-medium">企画者手数料</p>
              <p className="text-4xl font-bold text-pink-600 mb-2">20%</p>
              <p className="text-gray-700">
                集まった金額から差し引かれます
              </p>
            </div>

            {/* Fee 2 */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-2 font-medium">
                決済手数料
              </p>
              <p className="text-4xl font-bold text-pink-600 mb-2">3.6%</p>
              <p className="text-gray-700">
                Stripe決済 + 10円/件
              </p>
            </div>

            {/* Fee 3 */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-2 font-medium">振込手数料</p>
              <p className="text-4xl font-bold text-pink-600 mb-2">別途</p>
              <p className="text-gray-700">
                銀行の規程に基づき請求
              </p>
            </div>
          </div>

          <div className="mt-12 bg-blue-50 rounded-xl p-8 border border-blue-200">
            <h3 className="font-bold text-gray-900 text-lg mb-4">料金の例</h3>
            <p className="text-gray-700 mb-4">
              ¥100,000のお祝いが集まった場合：
            </p>
            <ul className="space-y-2 text-sm text-gray-700 ml-6 list-disc">
              <li>企画者手数料 (20%): -¥20,000</li>
              <li>決済手数料 (3.6% + 10円): -¥3,610</li>
              <li>振込手数料: -¥数百円</li>
              <li>
                <strong>企画者が受け取り額: ¥約76,000～77,000</strong>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-pink-500 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            さあ、始めましょう
          </h2>
          <p className="text-lg text-white/90">
            大切な人へのギフトを、みんなでお祝い。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/campaign/new"
              className="btn bg-white text-pink-600 hover:bg-gray-100 text-lg px-8 py-3 font-bold"
            >
              ファンディングを作る
            </Link>
            <Link
              href="/explore"
              className="btn bg-white/20 text-white hover:bg-white/30 text-lg px-8 py-3 font-bold border-2 border-white"
            >
              ギフトを探す
            </Link>
          </div>
        </div>
      </section>

      {/* Support */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-gray-700 mb-4">
            ご不明な点やご質問がございましたら、いつでもお気軽にお問い合わせください。
          </p>
          <a
            href="mailto:support@crowdbirthday.com"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            support@crowdbirthday.com
          </a>
        </div>
      </section>
    </div>
  );
}
