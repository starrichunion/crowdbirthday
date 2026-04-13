'use client';

interface MessageCardProps {
  emoji?: string;
  name?: string;
  amount: number;
  message?: string;
  anonymous?: boolean;
  createdAt?: Date;
}

const formatDate = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今日';
  if (days === 1) return '昨日';
  if (days < 7) return `${days}日前`;
  if (days < 30) return `${Math.floor(days / 7)}週前`;
  return `${Math.floor(days / 30)}ヶ月前`;
};

const formatAmount = (n: number) =>
  n >= 10000 ? `¥${(n / 10000).toFixed(n % 10000 ? 1 : 0)}万` : `¥${n.toLocaleString()}`;

export default function MessageCard({
  emoji = '😊',
  name,
  amount,
  message,
  anonymous,
  createdAt = new Date(),
}: MessageCardProps) {
  const displayName = anonymous ? '匿名' : name || '名前';
  const showMessage = message && message.trim().length > 0;

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-lg flex-shrink-0">
          {emoji}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{displayName}</p>
          <p className="text-xs text-gray-500">{formatDate(createdAt)}</p>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-pink-600">{formatAmount(amount)}</p>
        </div>
      </div>

      {/* Message */}
      {showMessage && (
        <p className="text-sm text-gray-700 leading-relaxed break-words">{message}</p>
      )}
    </div>
  );
}
