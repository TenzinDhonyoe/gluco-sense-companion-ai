
import { useNavigate, useLocation } from "react-router-dom";
import { Home, FileText, BarChart3, MessageSquare } from "lucide-react";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/logs", icon: FileText, label: "Log" },
    { path: "/insights", icon: BarChart3, label: "Insights" },
    { path: "/chat", icon: MessageSquare, label: "Chat" },
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-2 sm:px-4 lg:px-6 py-1 sm:py-2"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.25rem)' }}
    >
      <div className="flex justify-around max-w-sm sm:max-w-md mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center space-y-0.5 p-1 sm:p-1.5 rounded-lg transition-colors min-w-0 flex-1 max-w-20 ${
                isActive 
                  ? "text-primary bg-accent" 
                  : "text-muted-foreground hover:text-primary hover:bg-muted"
              }`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="text-caption font-medium truncate leading-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
