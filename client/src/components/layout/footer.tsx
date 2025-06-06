import React from 'react';

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-700 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <div className="mb-2 md:mb-0">
            <p>&copy; 2024 TikTok Creator Outreach. All rights reserved.</p>
            <p className="text-xs mt-1">
              Credit for <span className="text-primary font-medium">Digi4u Repair UK</span>, 
              developed by <span className="text-primary font-medium">Md Rehmanul Alam</span> 
              (<span className="text-primary font-medium">Replit Devs.</span>)
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}