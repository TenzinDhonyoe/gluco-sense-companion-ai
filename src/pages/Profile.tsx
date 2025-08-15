
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Settings, Bell, Bluetooth, Heart, Activity, Target, Trophy, Shield, HelpCircle, LogOut, RotateCcw } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  loadUserPreferences, 
  updatePreferredUnit, 
  type GlucoseUnit 
} from "@/lib/units";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [highAlerts, setHighAlerts] = useState(true);
  const [userName, setUserName] = useState("User");
  const [userInitials, setUserInitials] = useState("U");
  const [preferredUnit, setPreferredUnit] = useState<GlucoseUnit>('mg/dL');

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
    
    // Initialize user preferences for units
    const preferences = loadUserPreferences();
    setPreferredUnit(preferences.preferredUnit);
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
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

  const toggleUnit = () => {
    const newUnit = preferredUnit === 'mg/dL' ? 'mmol/L' : 'mg/dL';
    setPreferredUnit(newUnit);
    updatePreferredUnit(newUnit);
    toast({
      title: "Units Updated",
      description: `Glucose units changed to ${newUnit}`
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
        paddingTop: 'max(3rem, env(safe-area-inset-top))',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 8rem)' 
      }}
    >
      <div className="px-4 space-y-6">
        {/* Header spacing to match other screens */}
        <div className="py-4"></div>
        
        {/* Profile Header - Apple HIG compliant */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-md">
          <CardContent className="px-4 py-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-white/50">
                <AvatarImage src="/lovable-uploads/880f3ea4-efd1-4de5-93a4-d0d91ae981f7.png" alt={userName} />
                <AvatarFallback className="bg-white/30 text-white text-2xl font-bold">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold truncate">{userName}</h2>
                <p className="text-blue-100 text-base">Pre-diabetic monitoring</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className="bg-white/20 text-white text-xs">
                    <Trophy className="w-3 h-3 mr-1" />
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

        {/* Health Stats - Apple HIG compliant */}
        <Card className="bg-white rounded-2xl shadow-md">
          <CardHeader className="px-4 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Activity className="w-5 h-5 text-blue-500" />
              <span>Health Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <Heart className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">5.8%</div>
                <div className="text-sm text-gray-600">Current HbA1c</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">82%</div>
                <div className="text-sm text-gray-600">Time in Range</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Connection - Apple HIG compliant */}
        <Card className="bg-white rounded-2xl shadow-md">
          <CardHeader className="px-4 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Bluetooth className="w-5 h-5 text-blue-500" />
              <span>NIR Watch Connection</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="min-w-0 flex-1 pr-2">
                <p className="font-medium text-gray-900 text-base">GlucoSense Watch v2</p>
                <p className="text-sm text-gray-600">Device ID: 42 • Connected</p>
              </div>
              <Badge className="bg-green-100 text-green-700 text-xs">Connected</Badge>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between min-h-11">
                <span className="text-sm text-gray-600">Auto-sync readings</span>
                <Switch checked={autoSync} onCheckedChange={(value) => handleSettingChange('autoSync', value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings - Apple HIG compliant */}
        <Card className="bg-white rounded-2xl shadow-md">
          <CardHeader className="px-4 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Settings className="w-5 h-5 text-gray-600" />
              <span>Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 py-4">
            <div className="flex items-center justify-between min-h-11">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="text-gray-900 text-base">Push Notifications</span>
              </div>
              <Switch checked={notifications} onCheckedChange={(value) => handleSettingChange('notifications', value)} />
            </div>

            <div className="flex items-center justify-between min-h-11">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Shield className="w-5 h-5 text-gray-500" />
                <span className="text-gray-900 text-base">High Glucose Alerts</span>
              </div>
              <Switch checked={highAlerts} onCheckedChange={(value) => handleSettingChange('highAlerts', value)} />
            </div>

            <div className="flex items-center justify-between min-h-11">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <RotateCcw className="w-5 h-5 text-gray-500" />
                <span className="text-gray-900 text-base">Glucose Units</span>
              </div>
              <div 
                onClick={toggleUnit}
                className="relative inline-flex h-10 w-36 cursor-pointer rounded-full bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                role="switch"
                aria-checked={preferredUnit === 'mmol/L'}
                aria-label="Toggle glucose units"
              >
                <span
                  className={`pointer-events-none inline-block h-full w-1/2 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                    preferredUnit === 'mmol/L' ? 'translate-x-full' : 'translate-x-0'
                  }`}
                />
                <div className="absolute inset-0 flex">
                  <div className="flex-1 flex items-center justify-center px-2">
                    <span className={`text-sm font-medium whitespace-nowrap ${preferredUnit === 'mg/dL' ? 'text-blue-600' : 'text-gray-500'}`}>
                      mg/dL
                    </span>
                  </div>
                  <div className="flex-1 flex items-center justify-center px-2">
                    <span className={`text-sm font-medium whitespace-nowrap ${preferredUnit === 'mmol/L' ? 'text-blue-600' : 'text-gray-500'}`}>
                      mmol/L
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full justify-start h-12 text-base min-h-11">
              <HelpCircle className="w-4 h-4 mr-2" />
              Help & Support
            </Button>

            <Button onClick={handleSignOut} variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-12 text-base min-h-11">
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
