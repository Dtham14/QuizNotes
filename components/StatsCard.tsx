interface StatsCardProps {
  value: number | string;
  label: string;
  icon: string;
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'violet' | 'rose' | 'emerald';
}

const colorClasses = {
  blue: 'bg-blue-100',
  green: 'bg-green-100',
  amber: 'bg-amber-100',
  purple: 'bg-purple-100',
  violet: 'bg-violet-100',
  rose: 'bg-rose-100',
  emerald: 'bg-emerald-100',
};

export default function StatsCard({ value, label, icon, color = 'blue' }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
