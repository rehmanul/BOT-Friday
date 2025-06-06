import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  ChartLine, 
  BellRing, 
  Users, 
  Bot, 
  BarChart, 
  Settings,
  Activity,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileSidebarProps {
  sessionStatus?: {
    isActive: boolean;
    duration: string;
  };
}

export function MobileSidebar({ sessionStatus }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: ChartLine },
    { path: '/creators', label: 'Creator Discovery', icon: Users },
    { path: '/campaigns', label: 'Campaigns', icon: BellRing },
    { path: '/automation', label: 'Automation', icon: Bot },
    { path: '/analytics', label: 'Analytics', icon: BarChart },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card-bg border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">TikTok Pro</h1>
            <p className="text-xs text-gray-400">Automation Platform</p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="text-white hover:bg-gray-700"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="relative flex flex-col w-80 max-w-xs bg-card-bg border-r border-slate-700 h-full">
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
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors
                      ${isActive 
                        ? 'bg-primary/20 text-primary border border-primary/30' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Session Status */}
            <div className="p-4 border-t border-slate-700">
              <div className={`
                flex items-center space-x-3 p-3 rounded-lg border
                ${sessionStatus?.isActive 
                  ? 'bg-green-500/20 border-green-500/30' 
                  : 'bg-red-500/20 border-red-500/30'
                }
              `}>
                <div className={`
                  w-2 h-2 rounded-full
                  ${sessionStatus?.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}
                `} />
                <div>
                  <p className={`
                    text-sm font-medium
                    ${sessionStatus?.isActive ? 'text-green-400' : 'text-red-400'}
                  `}>
                    {sessionStatus?.isActive ? 'TikTok Session Active' : 'Session Inactive'}
                  </p>
                  {sessionStatus?.isActive && (
                    <p className="text-xs text-gray-400">
                      Runtime: {sessionStatus.duration}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}