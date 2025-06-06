"use client";

import { useState } from "react";
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

export function UserProfile({ notifications = 0 }: UserProfileProps) {
  const [imageError, setImageError] = useState(false);

  const user = {
    fullName: "Md. Rehmanul Alam Shojol",
    username: "Rehmanul",
    email: "rehman.shoj2@gmail.com",
    role: "Administrator",
    avatar: "https://www.digi4u.co.uk/image/catalog/logo.png", // ✅ Use a reliable image
  };

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div className="flex items-center space-x-4">
      {/* Notification Bell */}
      <div className="relative">
        <Bell className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
        {notifications > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {notifications}
          </span>
        )}
      </div>

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
            <p className="text-xs text-gray-400">{user.email}</p>
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
