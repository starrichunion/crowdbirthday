'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <div className="w-full">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-rose-50 to-violet-50" />
        <div className="absolute top-20 left-10 text-6xl opacity-20 animate-bounce" style={{ animationDuration: '3s' }}>
          🎁
        </div>
        <div
          className="absolute top-40 right-16 text-5xl opacity-20 animate-bounce"
          style={{ animationDuration: '4s', animationDelay: '1s' }}
        >
          🎉
        </div>

        <div className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              お祝いの気持ちを
              <br className="hidden sm:inline" />
              カンタンに届けよう
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              友達への投げ銭感覚のギフト、またはクリエイター向けのファンモード。
              eギフト型で世界中どこへでも。
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link
                href="/campaign/new"
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold text-lg hover:shadow-lg transition-all"
              >
                ページをつくる
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mode Cards Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">選べる2つのモード</h2>
            <p className="text-lg text-gray-600">あなたのシーンに合わせて選択できます</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Friend Mode */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-8 border-2 border-pink-200">
              <div className="text-4xl mb-4">👯</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">友達モード</h3>
              <p className="text-gray-600 mb-6">
                誕生日祝いや結婚祝いなど、大切な人へのギフト募集。LINEで相手が承認する安全な方式。
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ LINEで承認できる</li>
                <li>✓ メッセージ付きで送信可能</li>
                <li>✓ 30秒で募集開始</li>
              </ul>
            </div>

            {/* Fan Mode */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-8 border-2 border-violet-200">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">ファンモード</h3>
              <p className="text-gray-600 mb-6">
                クリエイターやインフルエンサー向け。ファンからの応援を投げ銭感覚で受け取れます。
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ 独自のギフトページ</li>
                <li>✓ 本人承認済みバッジ表示</li>
                <li>✓ 継続的に応援を募集</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">4ステップで完成</h2>
            <p className="text-lg text-gray-600">簡単4ステップでお祝いを届けられます</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { num: '1', icon: '✨', title: 'ページをつくる', desc: '30秒で完成。贈りたい相手と欲しいものを入力' },
              { num: '2', icon: '🤝', title: '相手が承認', desc: 'LINEで届く通知を受取人が承認。なりすまし防止' },
              { num: '3', icon: '📲', title: 'リンクをシェア', desc: 'LINEやSNSで仲間に共有。投げ銭感覚で' },
              { num: '4', icon: '🎁', title: 'eギフトが届く', desc: '集まった金額分のeギフトが自動で届く' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold flex items-center justify-center mx-auto mb-4 text-lg">
                  {step.num}
                </div>
                <div className="text-3xl mb-3">{step.icon}</div>
                <h4 className="font-bold text-gray-900 mb-2">{step.title}</h4>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">安心・安全</h2>
            <p className="text-lg text-gray-600">3つの安心で信頼されています</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-xl p-6 border border-green-200 text-center">
              <div className="text-4xl mb-3">✓</div>
              <h4 className="font-bold text-gray-900 mb-2">受取人が承認</h4>
              <p className="text-sm text-gray-600">LINEで本人確認。なりすまし一切なし</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 text-center">
              <div className="text-4xl mb-3">🔒</div>
              <h4 className="font-bold text-gray-900 mb-2">安心の決済</h4>
              <p className="text-sm text-gray-600">Stripeの最高レベルセキュリティ</p>
            </div>

            <div className="bg-purple-50 rounded-xl p-6 border border-purple-200 text-center">
              <div className="text-4xl mb-3">%</div>
              <h4 className="font-bold text-gray-900 mb-2">手数料10%のみ</h4>
              <p className="text-sm text-gray-600">シンプルな料金体系</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-pink-500 to-rose-400">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white">さあ、始めましょう</h2>
          <p className="text-lg text-white/90">
            お祝いの気持ちをカンタンに届けよう
          </p>
          <Link
            href="/campaign/new"
            className="inline-block px-8 py-4 rounded-2xl bg-white text-pink-600 font-bold text-lg hover:shadow-lg transition-all"
          >
            ページをつくる
          </Link>
        </div>
      </section>
    </div>
  );
}
