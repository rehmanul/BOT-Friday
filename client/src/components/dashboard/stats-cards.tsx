import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { DashboardStats } from '@/types';

interface StatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const cards = [
    {
      title: 'Active Campaigns',
      value: stats.activeCampaigns,
      growth: '+15%',
      isPositive: stats.activeCampaigns > 0,
      icon: '🎯'
    },
    {
      title: 'Creators Contacted',
      value: stats.creatorsContacted?.toLocaleString?.() ?? '0',
      growth: '+23%',
      isPositive: stats.creatorsContacted > 0,
      icon: '👥'
    },
    {
      title: 'Response Rate',
      value: `${stats.responseRate?.toFixed?.(1) ?? '0.0'}%`,
      growth: '+5.2%',
      isPositive: stats.responseRate > 0,
      icon: '📈'
    },
    {
      title: 'Total GMV',
      value: `$${stats.totalGMV?.toLocaleString?.() ?? '0'}`,
      growth: '+18.7%',
      isPositive: stats.totalGMV > 0,
      icon: '💰'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card-bg border-slate-700">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-slate-700 rounded w-3/4" />
                <div className="h-8 bg-slate-700 rounded w-1/2" />
                <div className="h-3 bg-slate-700 rounded w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card-bg border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">{card.title}</p>
                <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                <div className="flex items-center mt-2 text-sm">
                  {card.isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={card.isPositive ? 'text-green-500' : 'text-red-500'}>
                    {card.growth}
                  </span>
                  <span className="text-gray-400 ml-1">vs last period</span>
                </div>
              </div>
              <div className="text-2xl opacity-50">
                {card.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
