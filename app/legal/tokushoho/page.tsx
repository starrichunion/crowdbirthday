import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '特定商取引法に基づく表記 | CrowdBirthday',
  description: 'CrowdBirthday の特定商取引法に基づく表記ページ。事業者名、返品・交換、代金の支払時期、サービス提供時期などを掲載しています。',
};

type Row = {
  label: string;
  body: React.ReactNode;
};

const rows: Row[] = [
  {
    label: '事業者名',
    body: <>サービス責任者 千葉 幸治</>,
  },
  {
    label: '運営責任者',
    body: <>千葉 幸治</>,
  },
  {
    label: '所在地',
    body: (
      <>
        請求があれば遅滞なく開示します。
        <br />
        <span className="text-sm text-gray-500">
          お問い合わせメールアドレス宛にご連絡ください。
        </span>
      </>
    ),
  },
  {
    label: '電話番号',
    body: (
      <>
        請求があれば遅滞なく開示します。
        <br />
        <span className="text-sm text-gray-500">
          ご連絡はメールにて承っております。
        </span>
      </>
    ),
  },
  {
    label: 'メールアドレス',
    body: (
      <a
        href="mailto:starrichunion@gmail.com"
        className="text-pink-600 hover:text-pink-700 underline"
      >
        starrichunion@gmail.com
      </a>
    ),
  },
  {
    label: 'サービスの内容',
    body: (
      <>
        誕生日・記念日などのお祝いを目的としたギフト型クラウドファンディング
        プラットフォーム「CrowdBirthday」の運営・提供。
      </>
    ),
  },
  {
    label: '販売価格',
    body: (
      <>
        各キャンペーンページに表示された金額（日本円・税込）です。
        <br />
        プラットフォーム利用料として、調達総額の 5% を徴収いたします。
      </>
    ),
  },
  {
    label: '販売価格以外の必要料金',
    body: (
      <>
        決済手数料、通信料、サービス内容によって生じる実費はお客様負担となります。
      </>
    ),
  },
  {
    label: 'お支払い方法',
    body: (
      <>
        クレジットカード決済（Stripe, Inc. を通じて処理されます）。
        <br />
        対応カードブランド：VISA / Mastercard / American Express / JCB / Diners / Discover。
      </>
    ),
  },
  {
    label: 'お支払い時期',
    body: <>ご注文（応援・ギフト送付）の確定時に、即時決済されます。</>,
  },
  {
    label: 'サービスの提供時期',
    body: (
      <>
        キャンペーン成立後、主催者（またはシステム）によりeギフトがお届け先へ送信されます。
        <br />
        キャンペーンの成立条件・締切日時は各キャンペーンページをご確認ください。
      </>
    ),
  },
  {
    label: '返品・キャンセルについて',
    body: (
      <>
        デジタルコンテンツ（eギフト等）の性質上、送信完了後の返品・キャンセルは
        お受けできません。
        <br />
        ただし以下の場合、運営者判断にて返金対応を行うことがあります：
        <ul className="list-disc list-inside space-y-1 mt-2 ml-2 text-gray-700">
          <li>キャンペーンが締切までに目標を達成しなかった場合</li>
          <li>キャンペーンが主催者または運営によりキャンセルされた場合</li>
          <li>システム障害・不具合により正常にサービス提供ができなかった場合</li>
        </ul>
        <span className="block mt-3 text-sm text-gray-600">
          返金処理は Stripe を通じて元の決済手段へ返金されます。反映までに
          5〜10 営業日程度かかる場合があります。
        </span>
      </>
    ),
  },
  {
    label: '動作環境',
    body: (
      <>
        <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
          <li>最新版の Google Chrome / Safari / Microsoft Edge / Firefox</li>
          <li>LINE アプリ（LIFF 連携のため、最新版推奨）</li>
          <li>安定したインターネット接続環境</li>
        </ul>
      </>
    ),
  },
];

export default function TokushohoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        特定商取引法に基づく表記
      </h1>
      <p className="text-sm text-gray-500 mb-10">最終更新日：2026年4月16日</p>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left">
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.label}
                className={
                  idx !== rows.length - 1 ? 'border-b border-gray-100' : ''
                }
              >
                <th
                  scope="row"
                  className="w-1/3 bg-gray-50 px-6 py-5 align-top text-sm font-semibold text-gray-700"
                >
                  {row.label}
                </th>
                <td className="px-6 py-5 align-top text-gray-700 leading-relaxed">
                  {row.body}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 rounded-xl bg-pink-50 border border-pink-100 p-6 text-sm text-gray-700 leading-relaxed">
        本表記は、特定商取引に関する法律に基づくものです。個人事業主として運営
        しており、所在地および電話番号につきましては、プライバシー保護の観点から
        請求があった場合に遅滞なく開示いたします。
        <br />
        関連ページ：
        <Link
          href="/legal/terms"
          className="text-pink-600 hover:text-pink-700 underline ml-2"
        >
          利用規約
        </Link>
        <span className="mx-1 text-gray-400">|</span>
        <Link
          href="/legal/privacy"
          className="text-pink-600 hover:text-pink-700 underline"
        >
          プライバシーポリシー
        </Link>
      </div>
    </div>
  );
}
