
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Settings, 
  Bell, 
  Bluetooth, 
  Heart, 
  Activity,
  Target,
  Trophy,
  Shield,
  HelpCircle
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [highAlerts, setHighAlerts] = useState(true);

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
      description: `${setting} ${value ? 'enabled' : 'disabled'}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      <div className="p-6 space-y-6">
        {/* Profile Header */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Sarah Johnson</h2>
                <p className="text-blue-100">Pre-diabetic monitoring</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className="bg-white/20 text-white">
                    <Trophy className="w-3 h-3 mr-1" />
                    Level 3
                  </Badge>
                  <Badge className="bg-white/20 text-white">
                    847 points
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Stats */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <span>Health Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Heart className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">5.8%</div>
                <div className="text-sm text-gray-600">Current HbA1c</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">82%</div>
                <div className="text-sm text-gray-600">Time in Range</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Connection */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bluetooth className="w-5 h-5 text-blue-500" />
              <span>NIR Watch Connection</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">GlucoSense Watch v2</p>
                <p className="text-sm text-gray-600">Device ID: 42 • Connected</p>
              </div>
              <Badge className="bg-green-100 text-green-700">Connected</Badge>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Auto-sync readings</span>
                <Switch
                  checked={autoSync}
                  onCheckedChange={(value) => handleSettingChange('autoSync', value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-gray-600" />
              <span>Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="text-gray-900">Push Notifications</span>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={(value) => handleSettingChange('notifications', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-500" />
                <span className="text-gray-900">High Glucose Alerts</span>
              </div>
              <Switch
                checked={highAlerts}
                onCheckedChange={(value) => handleSettingChange('highAlerts', value)}
              />
            </div>

            <Button variant="outline" className="w-full justify-start">
              <HelpCircle className="w-4 h-4 mr-2" />
              Help & Support
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
