import { Bell } from "lucide-react";
import { UserProfile } from "./user-profile";

interface HeaderProps {
  title: string;
  subtitle?: string;
  notifications?: number;
}

export function Header({ title, subtitle, notifications = 0 }: HeaderProps) {
  return (
    <header className="bg-card-bg border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {subtitle && <p className="text-gray-400 mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Bell className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {notifications}
              </span>
            )}
          </div>
          <UserProfile />
        </div>
      </div>
    </header>
  );
}
