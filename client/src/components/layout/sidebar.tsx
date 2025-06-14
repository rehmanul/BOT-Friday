import { Link, useLocation } from 'wouter';
import { 
  ChartLine, 
  BellRing, 
  Users, 
  Bot, 
  BarChart, 
  Settings,
  Activity
} from 'lucide-react';

interface SidebarProps {
  sessionStatus?: {
    isActive: boolean;
    duration: string;
  };
}

export function Sidebar({ sessionStatus }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: ChartLine },
    { path: '/creators', label: 'Creator Discovery', icon: Users },
    { path: '/campaigns', label: 'Campaigns', icon: BellRing },
    { path: '/automation', label: 'Automation', icon: Bot },
    { path: '/analytics', label: 'Analytics', icon: BarChart },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-card-bg border-r border-slate-700 flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">TikTok Pro</h1>
            <p className="text-xs text-gray-400">Automation Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;

          return (
            <Link 
              key={item.path} 
              href={item.path}
            >
            <div 
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                isActive 
                  ? 'bg-primary/20 text-primary border border-primary/30' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </div>
          </Link>
          );
        })}
      </nav>

      {/* Session Status */}
      {sessionStatus && (
        <div className="p-4 border-t border-slate-700">
          <div className="text-center space-y-2">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
              sessionStatus.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                sessionStatus.isActive ? 'bg-green-400' : 'bg-red-400'
              }`} />
              {sessionStatus.isActive ? 'Session Active' : 'Session Inactive'}
            </div>
            {sessionStatus.isActive && (
              <div className="text-xs text-gray-400">
                Duration: {sessionStatus.duration}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Credits */}
      <div className="mt-auto p-4 border-t border-slate-700">
        <div className="text-center space-y-2">
          <div className="text-xs text-gray-400">Powered by</div>
          <div className="text-sm font-semibold text-white">Digi4u Repair UK</div>
          <div className="text-xs text-gray-500">
            Developed by{' '}
            <span className="text-blue-400 font-medium">
              Md Rehmanul Alam
            </span>
          </div>
          {/* Credit removed as requested */}
        </div>
      </div>
    </div>
  );
}