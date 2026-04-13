'use client';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        プライバシーポリシー
      </h1>
      <div className="text-gray-700 space-y-8">
        <div>
          <p className="text-sm text-gray-600 mb-4">
            最終更新日: 2026年4月12日
          </p>
          <p>
            CrowdBirthday（以下、「当社」）は、ユーザーの個人情報を適切に保護することを重視します。本プライバシーポリシーは、当社が個人情報をどのように収集、使用、保護するかについて説明するものです。
          </p>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            1. 収集する情報
          </h2>
          <p className="mb-4">
            当社が収集する個人情報には以下が含まれます：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>登録情報：</strong>
              氏名、メールアドレス、生年月日
            </li>
            <li>
              <strong>支払い情報：</strong>
              クレジットカード情報（Stripeにより暗号化・管理）
            </li>
            <li>
              <strong>プロフィール情報：</strong>
              アバター画像、表示名、自己紹介
            </li>
            <li>
              <strong>利用情報：</strong>
              ログイン履歴、アクセス情報、ブラウザ情報、IPアドレス
            </li>
            <li>
              <strong>キャンペーン情報：</strong>
              作成したキャンペーン、贈ったeGift、お祝いメッセージ
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            2. 情報の利用目的
          </h2>
          <p className="mb-4">
            収集した個人情報は以下の目的で利用されます：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>サービスの提供・運営及び改善</li>
            <li>ユーザー認証及びアカウント管理</li>
            <li>eGiftの購入・送付処理</li>
            <li>決済処理及びプラットフォーム手数料の請求</li>
            <li>キャンペーン受取人の承認プロセス（Friendモード）</li>
            <li>セキュリティ及び詐欺防止</li>
            <li>マーケティング及びプロモーション（opt-out可）</li>
            <li>カスタマーサポート及びお問い合わせ対応</li>
            <li>法的義務の履行</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            3. 第三者への提供
          </h2>
          <p className="mb-4">
            当社は以下の場合を除き、個人情報を第三者に提供しません：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>ユーザーの明示的な同意がある場合</li>
            <li>
              法令の規定、裁判所の命令、または政府機関の要請による場合
            </li>
            <li>
              eGift発行のためにギフトカードプロバイダーへ必要最小限の情報を提供する場合
            </li>
            <li>
              決済処理のためにStripeへ必要な情報を提供する場合
            </li>
            <li>当社の業務を委託する事業者への提供</li>
          </ul>
          <p className="mt-4">
            情報提供先には厳格な秘密保持契約を結びます。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            4. Cookie及び同様の技術
          </h2>
          <p className="mb-4">
            当社は、ユーザーの利便性向上のため、Cookie及び同様の技術を使用します：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>セッション管理（ログイン状態の維持）</li>
            <li>ユーザーの設定や環境設定の記憶</li>
            <li>アクセス分析及びサービス改善</li>
            <li>セキュリティ及び詐欺検出</li>
          </ul>
          <p className="mt-4">
            ユーザーはブラウザ設定により、Cookieを制限または削除できます。ただし、一部の機能が正常に動作しなくなる可能性があります。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            5. データの保持期間
          </h2>
          <p>
            個人情報は利用目的の達成に必要な期間保持されます：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
            <li>
              <strong>登録情報：</strong>
              アカウント削除後、30日以内に削除
            </li>
            <li>
              <strong>取引情報：</strong>
              完了から7年間（税務・監査上の理由）
            </li>
            <li>
              <strong>ログ情報：</strong>
              90日間
            </li>
            <li>
              <strong>支払い情報：</strong>
              Stripeのセキュリティポリシーに従い管理
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            6. ユーザーの権利
          </h2>
          <p className="mb-4">
            個人情報に関して、ユーザーは以下の権利を有します：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>アクセス権：</strong>
              自身の個人情報を確認する権利
            </li>
            <li>
              <strong>修正権：</strong>
              不正確な情報を修正する権利
            </li>
            <li>
              <strong>削除権：</strong>
              個人情報の削除を請求する権利
            </li>
            <li>
              <strong>異議権：</strong>
              特定の処理に異議を唱える権利
            </li>
            <li>
              <strong>ポータビリティ：</strong>
              個人情報を転送可能な形式で取得する権利
            </li>
          </ul>
          <p className="mt-4">
            これらの権利を行使したい場合は、privacy@crowdbirthday.comまでお問い合わせください。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            7. セキュリティ対策
          </h2>
          <p className="mb-4">
            当社は以下のセキュリティ対策を実施しています：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>暗号化：</strong>
              SSL/TLS暗号化により、通信を保護
            </li>
            <li>
              <strong>決済セキュリティ：</strong>
              Stripe決済システムにより、PCI DSS レベル1コンプライアンスを達成
            </li>
            <li>
              <strong>アクセス制御：</strong>
              最小限の必要なスタッフのみがアクセス可能
            </li>
            <li>
              <strong>監視：</strong>
              不正アクセスや異常をリアルタイムで監視
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            8. 個人情報保護法コンプライアンス
          </h2>
          <p className="mb-4">
            当社は日本国内の個人情報保護法（APPI）及びGDPR（EU一般データ保護規則）を遵守します：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>個人情報の取得は適切に行われます</li>
            <li>利用目的の通知・公表を行います</li>
            <li>個人情報の安全管理に努めます</li>
            <li>本人からの請求に応じます</li>
            <li>個人情報侵害時は72時間以内に報告します</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            9. 子どものプライバシー
          </h2>
          <p>
            当社サービスは18歳以上のユーザーのみを対象としています。18歳未満の方からの個人情報収集は行いません。万が一、18歳未満からの情報収集が発覚した場合は、直ちに削除します。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            10. 変更及び更新
          </h2>
          <p>
            当社は、本プライバシーポリシーを随時変更する場合があります。重要な変更がある場合は、メールで事前に通知いたします。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            11. お問い合わせ
          </h2>
          <p>
            プライバシーに関するご質問、ご懸念、または権利行使のご希望については、以下にお問い合わせください。
          </p>
          <p className="mt-4">
            メール: privacy@crowdbirthday.com
          </p>
        </section>

        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 mt-12">
          <p className="text-sm text-blue-900">
            当社は、ユーザーの個人情報を尊重し、適切に保護することをお約束します。ご不安な点やご不明な点がございましたら、いつでもお気軽にお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}
