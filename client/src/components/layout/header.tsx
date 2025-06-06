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
          <UserProfile />
        </div>
      </div>
    </header>
  );
}
