'use client';

import { useState } from 'react';
import { X, Shield } from 'lucide-react';
import QuickAmount from './QuickAmount';

interface ContributeModalProps {
  recipientName?: string;
  campaignId?: string;
  onSuccess?: () => void;
  mode?: 'friend' | 'fan';
}

export default function ContributeModal({
  recipientName = '相手',
  campaignId,
  onSuccess,
  mode = 'friend',
}: ContributeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  const amounts = mode === 'friend' ? [1000, 3000, 5000, 10000, 30000] : [500, 1000, 3000, 5000, 10000];
  const finalAmount = selectedAmount || (customAmount ? parseInt(customAmount) : 0);
  const isFriend = mode === 'friend';

  const handleSubmit = () => {
    if (!finalAmount || finalAmount < 500) {
      alert('有効な金額を入力してください');
      return;
    }

    setIsOpen(false);
    setSelectedAmount(null);
    setCustomAmount('');
    setMessage('');
    setAnonymous(false);

    if (onSuccess) {
      onSuccess();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedAmount(null);
    setCustomAmount('');
    setMessage('');
    setAnonymous(false);
  };

  if (!isOpen) {
    return null;
  }

  const bgGradient = isFriend
    ? 'bg-gradient-to-b from-pink-50 to-white'
    : 'bg-gradient-to-b from-violet-50 to-white';

  const buttonGradient = isFriend
    ? 'bg-gradient-to-r from-pink-500 to-rose-400'
    : 'bg-gradient-to-r from-violet-500 to-purple-400';

  const headerText = isFriend ? '気持ちを送る' : '応援する';
  const submitText = finalAmount ? `${finalAmount.toLocaleString()}円を${isFriend ? '送る' : '応援する'}` : '金額を選んでね';

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">{headerText}</h2>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Quick Amounts */}
          <div className="mb-5">
            <div className="text-sm text-gray-500 mb-2">金額を選ぶ</div>
            <div className="flex flex-wrap gap-2">
              {amounts.map((amount) => (
                <QuickAmount
                  key={amount}
                  amount={amount}
                  selected={selectedAmount === amount}
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount('');
                  }}
                />
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="mb-5">
            <div className="text-sm text-gray-500 mb-2">または自由に入力</div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">¥</span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                placeholder="0"
                className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-gray-200 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>
          </div>

          {/* Message (Friend Mode Only) */}
          {isFriend && (
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-2">メッセージ（任意）</div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="おめでとう！🎉"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none text-sm"
              />
            </div>
          )}

          {/* Anonymous Checkbox */}
          <label className="flex items-center gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="w-4 h-4 rounded accent-pink-500"
            />
            <span className="text-sm text-gray-700">匿名で{isFriend ? '参加' : '応援'}</span>
          </label>

          {/* Security Note */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6 flex items-start gap-2">
            <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">Stripeによる安全な決済です</p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={finalAmount < 500}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              finalAmount >= 500
                ? `${buttonGradient} text-white hover:shadow-lg`
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            {finalAmount >= 500 && finalAmount}
            {finalAmount >= 500 && '円を'}
            {finalAmount < 500 ? '金額を選んでね' : isFriend ? '送る' : '応援する'}
          </button>
        </div>
      </div>
    </div>
  );
}
