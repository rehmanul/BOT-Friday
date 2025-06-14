// Notification List Component (must be at top-level, after imports)
function NotificationsListComponent() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) throw new Error("Failed to fetch notifications");
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch (e) {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-gray-400">Loading notifications...</div>;
  }
  if (!notifications.length) {
    return <div className="p-4 text-center text-gray-400">No notifications</div>;
  }
  return (
    <ul className="divide-y divide-slate-700 max-h-80 overflow-y-auto" role="listbox" aria-label="Notifications">
      {notifications.map((n) => (
        <li
          key={n.id}
          className={`px-4 py-3 text-sm cursor-pointer focus:bg-slate-700 focus:outline-none ${n.read ? "text-gray-400" : "text-white bg-slate-700/30"}`}
          tabIndex={0}
          role="option"
          aria-selected={!n.read ? "true" : "false"}
        >
          <div className="font-medium truncate">{n.title}</div>
          <div className="text-xs text-gray-400 truncate">{n.message}</div>
          <div className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
        </li>
      ))}
    </ul>
  );
}
"use client";

import { useState, useEffect } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Notification } from "@/types";
import { User, Settings, LogOut, Bell } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserProfileProps {
  notifications?: number;
}

interface UserProfileData {
  username: string;
  fullName: string;
  email?: string;
  role?: string;
  avatar: string;
}

export function UserProfile({ notifications = 0 }: UserProfileProps) {
  const [imageError, setImageError] = useState(false);
  const [user, setUser] = useState<UserProfileData | null>(null);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const response = await fetch('/api/session/profile');
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        const data = await response.json();
        if (data && data.profile) {
          setUser({
            username: data.profile.username || '',
            fullName: data.profile.displayName || data.profile.username || '',
            email: '', // Email not provided by session API
            role: 'User', // Default role, can be updated if available
            avatar: data.profile.avatar || 'https://via.placeholder.com/40',
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    }
    fetchUserProfile();
  }, []);

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
    : "";

  if (!user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Bell className="h-5 w-5 text-gray-400 cursor-pointer transition-colors" />
        </div>
        <div className="flex items-center space-x-3 cursor-pointer rounded-lg p-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              ...
            </AvatarFallback>
          </Avatar>
          <div className="text-sm hidden md:block">
            <div className="text-white font-medium">Loading...</div>
            <div className="text-gray-400 text-xs">User</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">

      {/* Notification Bell with Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full"
            aria-label="Show notifications"
            type="button"
          >
            <Bell className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" aria-hidden="true" />
            {notifications > 0 && (
              <span
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center"
                aria-label={`${notifications} new notifications`}
                role="status"
              >
                {notifications}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="p-0 w-80 bg-slate-800 border-slate-700">
          <NotificationsListComponent />
        </PopoverContent>
      </Popover>


      {/* User Profile Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center space-x-3 cursor-pointer hover:bg-slate-700 rounded-lg p-2 transition-colors">
            <Avatar className="h-8 w-8">
              {!imageError && (
                <AvatarImage
                  src={user.avatar}
                  alt={user.fullName}
                  onError={() => setImageError(true)}
                />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm hidden md:block">
              <div className="text-white font-medium">{user.fullName}</div>
              <div className="text-gray-400 text-xs">{user.role}</div>
            </div>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-56 bg-slate-800 border-slate-700"
          align="end"
        >
          <DropdownMenuLabel className="text-white">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user.fullName}</p>
              {user.email && <p className="text-xs text-gray-400">{user.email}</p>}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-700" />

          <DropdownMenuItem className="text-gray-300 hover:bg-slate-700 hover:text-white">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem className="text-gray-300 hover:bg-slate-700 hover:text-white">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-slate-700" />

          <DropdownMenuItem className="text-red-400 hover:bg-red-900/20 hover:text-red-300">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
