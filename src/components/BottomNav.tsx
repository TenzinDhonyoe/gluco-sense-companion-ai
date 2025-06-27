
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
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-3 sm:px-6 py-2 sm:py-3"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center space-y-0.5 sm:space-y-1 p-1 sm:p-2 rounded-lg transition-colors min-w-0 ${
                isActive 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="text-xs font-medium truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
