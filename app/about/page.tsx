import Link from 'next/link';
import {
  Gift,
  Heart,
  Shield,
  Users,
  Sparkles,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'クラウドバースデーとは？ | CrowdBirthday',
  description:
    '友達やファンからのお祝いを「気持ちのこもったeギフト」に変えるクラウドファンディング型のバースデープラットフォームです。',
};

const HowItWorks = ({
  step,
  title,
  body,
}: {
  step: string;
  title: string;
  body: string;
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
    <div className="text-xs font-bold text-pink-500 mb-1">{step}</div>
    <div className="font-bold text-gray-900 mb-2">{title}</div>
    <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
  </div>
);

const Feature = ({
  icon: Icon,
  title,
  body,
}: {
  icon: any;
  title: string;
  body: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-pink-600" />
    </div>
    <div>
      <div className="font-semibold text-gray-900 text-sm mb-0.5">{title}</div>
      <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
    </div>
  </div>
);

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
        {/* Hero */}
        <section className="px-6 pt-12 pb-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-pink-100 rounded-full px-4 py-1.5 text-xs font-bold text-pink-600 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            CrowdBirthday とは？
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-3">
            お祝いの気持ちを、
            <br className="sm:hidden" />
            みんなで贈ろう。
          </h1>
          <p className="text-gray-600 leading-relaxed">
            CrowdBirthday は、誕生日や記念日などのお祝いを
            <b>クラウドファンディング型のeギフト</b>に変える
            プラットフォームです。LINEで承認・参加できるので、
            アカウント作成いらずで誰でもカンタンに使えます。
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-pink-100 text-pink-700 font-semibold">
              手数料のみで運営透明
            </span>
            <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 font-semibold">
              本人承認済みの安心
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
              eギフト自動送付
            </span>
          </div>
        </section>

        {/* 2 Modes */}
        <section className="px-6 pb-10 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            2つの使い方
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="text-2xl mb-2">👫</div>
              <div className="font-bold text-gray-900 mb-1">友達モード</div>
              <p className="text-sm text-gray-600 leading-relaxed">
                友達のお祝いを企画して、仲間たちから応援を集めます。
                受取人はLINEで承認するだけ。eギフトは自動で本人へ。
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="text-2xl mb-2">🎤</div>
              <div className="font-bold text-gray-900 mb-1">ファンモード</div>
              <p className="text-sm text-gray-600 leading-relaxed">
                配信者・クリエイターが自分宛の応援ページを作成。
                SNSで告知して、ファンから直接気持ちを受け取れます。
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 pb-10 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4">使い方の流れ</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <HowItWorks
              step="STEP 1"
              title="ページをつくる"
              body="LINEログイン後、お祝いしたい人や欲しい物を入力してページを作成。"
            />
            <HowItWorks
              step="STEP 2"
              title="共有する"
              body="生成されたリンクをLINEやXで共有。応援者は決済して気持ちを送ります。"
            />
            <HowItWorks
              step="STEP 3"
              title="eギフトが届く"
              body="集まった金額からプラットフォーム手数料を引いた額が本人にeギフトで届きます。"
            />
          </div>
        </section>

        {/* Why safe */}
        <section className="px-6 pb-10 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4">安心の理由</h2>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
            <Feature
              icon={Shield}
              title="本人承認済み"
              body="受取人が必ずLINEで承認してから公開されるため、なりすましを防ぎます。"
            />
            <Feature
              icon={CheckCircle2}
              title="Stripe決済"
              body="決済はStripeを通じて安全に処理。カード情報は当社サーバーには保存されません。"
            />
            <Feature
              icon={Mail}
              title="eギフトで自動送付"
              body="集まった金額は本人のメールに直接eギフトで届くため、現金の受渡し不要。"
            />
            <Feature
              icon={Users}
              title="匿名参加もOK"
              body="贈る側は名前を出しても、匿名でも、自由に選べます。"
            />
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-16 max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-pink-500 to-rose-400 rounded-3xl p-8 text-white shadow-lg">
            <Gift className="w-10 h-10 mx-auto mb-3 opacity-90" />
            <h3 className="text-xl font-bold mb-2">
              さっそくページをつくろう
            </h3>
            <p className="text-sm text-white/90 mb-5 leading-relaxed">
              LINEログインで30秒。誰かのお祝いを、もっと特別に。
            </p>
            <Link
              href="/campaign/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-pink-600 font-bold hover:shadow-xl transition-all"
            >
              <Heart className="w-4 h-4" />
              ページをつくる
            </Link>
          </div>

          <p className="mt-8 text-xs text-gray-500">
            ご質問は{' '}
            <a
              href="mailto:hello@crowdbirthday.com"
              className="text-pink-600 underline"
            >
              hello@crowdbirthday.com
            </a>{' '}
            まで。
          </p>
        </section>
      </div>
    </>
  );
}
