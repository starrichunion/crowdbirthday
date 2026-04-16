'use client';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">利用規約</h1>
      <div className="text-gray-700 space-y-8">
        <div>
          <p className="text-sm text-gray-600 mb-4">
            最終更新日: 2026年4月12日
          </p>
          <p>
            本利用規約（以下、「本規約」）は、CrowdBirthdayが提供するCrowdBirthdayサービス（以下、「本サービス」）の利用に関する諸条件を定めるものです。ユーザーが本サービスを利用する場合、本規約に同意したものとみなします。
          </p>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            1. サービス概要
          </h2>
          <p className="mb-4">
            CrowdBirthdayは、誕生日や結婚、出産などのお祝い行事に対して、複数の人からeGift（電子ギフト）の形でお祝いを届けるプラットフォームです。本サービスは以下の機能を提供します：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>お祝いキャンペーンの作成・管理（Friendモード / Fanモード）</li>
            <li>eGift（電子ギフトカード）によるお祝いの送受信</li>
            <li>お祝いメッセージの投稿・閲覧</li>
            <li>キャンペーンの共有・拡散機能</li>
            <li>企画者向けダッシュボード</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            2. キャンペーンモード
          </h2>
          <p className="mb-4">
            本サービスでは2種類のキャンペーンモードを提供しています：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Friendモード：</strong>
              友人・家族間で、企画者が受取人のためにキャンペーンを作成し、参加者がeGiftを贈るモード。受取人の承認が必要です。
            </li>
            <li>
              <strong>Fanモード：</strong>
              クリエイター・インフルエンサー向けに、ファンがeGiftでお祝いを届けるモード。ティッピング（投げ銭）に近い形式です。
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            3. 利用条件
          </h2>
          <p className="mb-4">
            本サービスの利用にあたり、ユーザーは以下の条件に同意するものとします：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>本サービスは18歳以上のユーザーのみが利用できます</li>
            <li>ユーザーは真実かつ正確な登録情報を提供するものとします</li>
            <li>ユーザーは自身のアカウント情報を管理し、他者の使用を防ぐものとします</li>
            <li>ユーザーは本規約及び法令を遵守するものとします</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            4. 禁止事項
          </h2>
          <p className="mb-4">
            ユーザーは以下の行為を行ってはならないものとします：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>違法な目的でのサービス利用</li>
            <li>他者の権利や名誉を侵害する行為</li>
            <li>詐欺的なキャンペーンの作成</li>
            <li>本サービスの不正利用やハッキング行為</li>
            <li>公序良俗に反する内容の投稿</li>
            <li>他のユーザーへの嫌がらせやいじめ</li>
            <li>本サービスに過度な負荷をかける行為</li>
            <li>eGiftの不正な転売・換金行為</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            5. eGiftについて
          </h2>
          <p className="mb-4">
            本サービスで提供されるeGift（電子ギフトカード）について：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>eGiftは提携先のギフトカードプロバイダーを通じて発行されます</li>
            <li>eGiftの有効期限・利用条件は各プロバイダーの規約に従います</li>
            <li>購入完了後のeGiftのキャンセル・返金は原則としてできません</li>
            <li>eGiftは受取人に対してメール又はリンクで送付されます</li>
            <li>当社はeGiftの発行元ではなく、仲介プラットフォームです</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            6. 手数料
          </h2>
          <p className="mb-4">
            本サービスを利用する場合、以下の手数料が発生します：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>プラットフォーム手数料：</strong>eGift購入金額の10%（税込）
            </li>
            <li>
              <strong>決済手数料：</strong>Stripeにより別途請求（約3.6% + 40円/件）
            </li>
          </ul>
          <p className="mt-4">
            手数料はeGift購入時に自動的に加算されます。贈り手（参加者）が手数料を負担します。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            7. 免責事項
          </h2>
          <p className="mb-4">
            本サービスは「現状有姿」で提供されます。以下について、当社は一切の責任を負いません：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>サービスの中断や停止による損害</li>
            <li>eGiftの利用に関するプロバイダー側の問題</li>
            <li>ユーザー間のトラブルや紛争</li>
            <li>第三者による不正アクセスやデータ漏洩</li>
            <li>本サービスの利用により生じたあらゆる損害</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            8. 準拠法
          </h2>
          <p>
            本規約の有効性、解釈及び履行は、日本国法に準拠するものとします。本規約に関する一切の紛争は、東京地方裁判所を専属的合意管轄裁判所とします。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            9. 規約の変更
          </h2>
          <p>
            当社は、事前の通知なしに本規約を変更する場合があります。変更後の規約は、本サイトに掲載された時点から有効となります。継続的なご利用は、変更後の規約への同意とみなします。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            10. お問い合わせ
          </h2>
          <p>
            本規約に関するご質問やご指摘がある場合は、以下の方法でお問い合わせください。
          </p>
          <p className="mt-4">
            メール: starrichunion@gmail.com
          </p>
        </section>

        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 mt-12">
          <p className="text-sm text-blue-900">
            本規約は日本語を正文とします。翻訳版と日本語版に相違がある場合は、日本語版が優先されます。
          </p>
        </div>
      </div>
    </div>
  );
}
