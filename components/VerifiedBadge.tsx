import { UserCheck } from 'lucide-react';

export default function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
      <UserCheck className="w-3 h-3" />
      本人承認済み
    </span>
  );
}
