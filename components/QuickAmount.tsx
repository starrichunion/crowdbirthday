interface QuickAmountProps {
  amount: number;
  selected: boolean;
  onClick: () => void;
}

const formatAmount = (n: number) =>
  n >= 10000 ? `¥${(n / 10000).toFixed(n % 10000 ? 1 : 0)}万` : `¥${n.toLocaleString()}`;

export default function QuickAmount({ amount, selected, onClick }: QuickAmountProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
        selected
          ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-lg scale-105'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {formatAmount(amount)}
    </button>
  );
}
