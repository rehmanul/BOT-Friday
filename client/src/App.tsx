import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toast-system";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Footer } from "@/components/layout/footer";
import { useIsMobile } from "@/hooks/use-mobile";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Campaigns from "@/pages/campaigns";
import Creators from "@/pages/creators";
import Automation from "@/pages/automation";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";

function AppRouter() {
  const isMobile = useIsMobile();
  const sessionStatus = { isActive: true, duration: "2h 34m" };

  return (
    <div className="flex h-screen bg-dark-bg text-text-primary">
      {/* Desktop Sidebar - always render but conditionally show */}
      <div className={`${isMobile ? "hidden" : "block"}`}>
        <Sidebar sessionStatus={sessionStatus} />
      </div>
      
      {/* Mobile Sidebar - only render when mobile */}
      {isMobile && <MobileSidebar sessionStatus={sessionStatus} />}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="TikTok Creator Outreach- Digi4u Repair UK"
          subtitle="Automated influencer marketing platform"
          notifications={3}
        />
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/campaigns" component={Campaigns} />
          <Route path="/creators" component={Creators} />
          <Route path="/automation" component={Automation} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
