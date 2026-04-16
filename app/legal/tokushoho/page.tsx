'use client';

export default function TokushohoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        特定商取引法に基づく表記
      </h1>
      <div className="text-gray-700 space-y-8">
        <div>
          <p className="text-sm text-gray-600 mb-4">
            最終更新日: 2026年4月16日
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <th className="bg-gray-50 px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3 align-top">
                  事業者名
                </th>
                <td className="px-6 py-4 text-sm text-gray-700">
                  CrowdBirthday（個人事業）
                </td>
              </tr>
              <tr>
                <th className="bg-gray-50 px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3 align-top">
                  代表者
                </th>
                <td className="px-6 py-4 text-sm text-gray-700">
                  代表 こうじ
                </td>
              </tr>
              <tr>
                <th className="bg-gray-50 px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3 align-top">
                  所在地
                </th>
                <td className="px-6 py-4 text-sm text-gray-700">
                  請求があった場合には遅滞なく開示いたします。
                  <br />
                  お問い合わせ先メールアドレスまでご連絡ください。
                </td>
              </tr>
              <tr>
                <th className="bg-gray-50 px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3 align-top">
                  連絡先
                </th>
                <td className="px-6 py-4 text-sm text-gray-700">
                  メール: support@crowdbirthday.com
                  <br />
                  ※お問い合わせはメールにて受け付けております
                </td>
              </tr>
              <tr>
                <th className="bg-gray-50 px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3 align-top">
                  販売価格
                </th>
                <td className="px-6 py-4 text-sm text-gray-700">
                  各キャンペーンページに記載の金額（税込）
                </td>
              </tr>
              <tr>
                <th className="bg-gray-50 px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3 align-top">
                  販売価格以外の必要料金
                </th>
                <td className="px-6 py-4 text-sm text-gray-700">
                  プラットフォーム手数料: eGift購入金額の10%（税込）
                  <br />
                  決済手数料: Stripeにより約3.6% + 40円/件
                </td>
              </tr>
              <tr>
                <th className="bg-gray-50 px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3 align-top">
                  支払方法
                </th>
                <td className="px-6 py-4 text-sm text-gray-700">
                  クレジットカード（Visa, Mastercard, American Express, JCB）
                  <br />
                  ※Stripe決済システムを利用
                </td>
              </tr>
              <tr>
                <th className="bg-gray-50 px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3 align-top">
                  支払時期
                </th>
                <td className="px-6 py-4 text-sm text-gray-700">
                  お祝い金送信時に即時決済
                </td>
              </tr>
              <tr>
                <th className="bg-gray-50 px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3 align-top">
                  商品の引渡し時期
                </th>
                <td className="px-6 py-4 text-sm text-gray-700">
                  キャンペーン目標金額到達後、eGift（電子ギフトカード）をメールにて送付。
                  <br />
                  目標金額未到達の場合は全額返金。
                </td>
              </tr>
              <tr>
                <th className="bg-gray-50 px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3 align-top">
                  返品・キャンセルについて
                </th>
                <td className="px-6 py-4 text-sm text-gray-700">
                  キャンペーン目標金額未到達の場合: 全額返金（手数料なし）
                  <br />
                  eGift発行後のキャンセル・返金: 原則不可
                  <br />
                  サービスの不具合による場合: 個別にご対応いたします
                </td>
              </tr>
              <tr>
                <th className="bg-gray-50 px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3 align-top">
                  サービス内容
                </th>
                <td className="px-6 py-4 text-sm text-gray-700">
                  お祝い行事（誕生日、結婚、出産等）に対し、複数の人からeGift（電子ギフトカード）の形でお祝いを届けるクラウドファンディングプラットフォームの提供
                </td>
              </tr>
              <tr>
                <th className="bg-gray-50 px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3 align-top">
                  動作環境
                </th>
                <td className="px-6 py-4 text-sm text-gray-700">
                  インターネット接続環境が必要です。
                  <br />
                  推奨ブラウザ: Google Chrome, Safari, Firefox, Microsoft Edge の最新版
                  <br />
                  LINE内蔵ブラウザに対応
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 mt-12">
          <p className="text-sm text-blue-900">
            本表記に関するご質問がございましたら、support@crowdbirthday.com までお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}
