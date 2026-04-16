import Link from 'next/link';
import { Gift, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🎂</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          ページが見つかりません
        </h1>
        <p className="text-gray-600 mb-8">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            トップに戻る
          </Link>
          <Link
            href="/campaign/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-pink-600 rounded-xl border-2 border-pink-200 hover:bg-pink-50 transition-colors font-medium"
          >
            <Gift className="w-4 h-4" />
            お祝いを企画する
          </Link>
        </div>
      </div>
    </div>
  );
}
