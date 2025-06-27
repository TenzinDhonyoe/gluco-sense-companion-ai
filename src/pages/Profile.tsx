
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Settings, Bell, Bluetooth, Heart, Activity, Target, Trophy, Shield, HelpCircle, LogOut } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [highAlerts, setHighAlerts] = useState(true);
  const [userName, setUserName] = useState("User");
  const [userInitials, setUserInitials] = useState("U");

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();

        if (profile && profile.name) {
          setUserName(profile.name);
          const initials = profile.name
            .split(' ')
            .map(name => name.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
          setUserInitials(initials);
        }
      }
    };

    fetchUserProfile();
  }, []);

  const handleSettingChange = (setting: string, value: boolean) => {
    switch (setting) {
      case 'notifications':
        setNotifications(value);
        break;
      case 'autoSync':
        setAutoSync(value);
        break;
      case 'highAlerts':
        setHighAlerts(value);
        break;
    }
    toast({
      title: "Settings Updated",
      description: `${setting} ${value ? 'enabled' : 'disabled'}`
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      style={{ 
        paddingTop: 'env(safe-area-inset-top)', 
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' 
      }}
    >
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Profile Header - Mobile optimized */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Avatar className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-white/50 flex-shrink-0">
                <AvatarImage src="/lovable-uploads/880f3ea4-efd1-4de5-93a4-d0d91ae981f7.png" alt={userName} />
                <AvatarFallback className="bg-white/30 text-white text-lg sm:text-2xl font-bold">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl font-bold truncate">{userName}</h2>
                <p className="text-blue-100 text-sm sm:text-base">Pre-diabetic monitoring</p>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                  <Badge className="bg-white/20 text-white text-xs">
                    <Trophy className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                    Level 3
                  </Badge>
                  <Badge className="bg-white/20 text-white text-xs">
                    847 points
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Stats - Mobile optimized */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
              <span>Health Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mx-auto mb-1 sm:mb-2" />
                <div className="text-lg sm:text-2xl font-bold text-green-600">5.8%</div>
                <div className="text-xs sm:text-sm text-gray-600">Current HbA1c</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 mx-auto mb-1 sm:mb-2" />
                <div className="text-lg sm:text-2xl font-bold text-blue-600">82%</div>
                <div className="text-xs sm:text-sm text-gray-600">Time in Range</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Connection - Mobile optimized */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Bluetooth className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
              <span>NIR Watch Connection</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="min-w-0 flex-1 pr-2">
                <p className="font-medium text-gray-900 text-sm sm:text-base">GlucoSense Watch v2</p>
                <p className="text-xs sm:text-sm text-gray-600">Device ID: 42 • Connected</p>
              </div>
              <Badge className="bg-green-100 text-green-700 text-xs flex-shrink-0">Connected</Badge>
            </div>
            <div className="pt-3 sm:pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-600">Auto-sync readings</span>
                <Switch checked={autoSync} onCheckedChange={(value) => handleSettingChange('autoSync', value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings - Mobile optimized */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
              <span>Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                <span className="text-gray-900 text-sm sm:text-base">Push Notifications</span>
              </div>
              <Switch checked={notifications} onCheckedChange={(value) => handleSettingChange('notifications', value)} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                <span className="text-gray-900 text-sm sm:text-base">High Glucose Alerts</span>
              </div>
              <Switch checked={highAlerts} onCheckedChange={(value) => handleSettingChange('highAlerts', value)} />
            </div>

            <Button variant="outline" className="w-full justify-start h-10 sm:h-12 text-sm sm:text-base">
              <HelpCircle className="w-4 h-4 mr-2" />
              Help & Support
            </Button>

            <Button onClick={handleSignOut} variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-10 sm:h-12 text-sm sm:text-base">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
