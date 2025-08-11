import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon, 
  Smartphone, 
  Watch, 
  Activity,
  Shield,
  Download,
  Bell,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPreferredUnit, updatePreferredUnit } from '@/lib/units';

interface DeviceIntegration {
  id: string;
  name: string;
  type: 'cgm' | 'fitness' | 'health';
  icon: React.ElementType;
  status: 'connected' | 'disconnected' | 'syncing';
  lastSync?: Date;
  signalQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  batteryLevel?: number;
}

interface NotificationSettings {
  glucoseAlerts: boolean;
  mealReminders: boolean;
  exerciseReminders: boolean;
  weeklyReports: boolean;
}

const Settings = () => {
  const [preferredUnit, setPreferredUnit] = useState<'mg/dL' | 'mmol/L'>('mg/dL');
  const [notifications, setNotifications] = useState<NotificationSettings>({
    glucoseAlerts: true,
    mealReminders: false,
    exerciseReminders: true,
    weeklyReports: true
  });
  
  const [deviceIntegrations] = useState<DeviceIntegration[]>([
    {
      id: 'freestyle-libre',
      name: 'FreeStyle Libre 3',
      type: 'cgm',
      icon: Activity,
      status: 'connected',
      lastSync: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      signalQuality: 'excellent',
      batteryLevel: 85
    },
    {
      id: 'apple-health',
      name: 'Apple Health',
      type: 'health',
      icon: Smartphone,
      status: 'connected',
      lastSync: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
    },
    {
      id: 'apple-watch',
      name: 'Apple Watch',
      type: 'fitness',
      icon: Watch,
      status: 'syncing',
      lastSync: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      signalQuality: 'good',
      batteryLevel: 42
    }
  ]);

  // Load preferences on mount
  useEffect(() => {
    setPreferredUnit(getPreferredUnit());
    
    // Load notification settings from localStorage
    const savedNotifications = localStorage.getItem('notification_settings');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    }
  }, []);

  // Handle unit toggle
  const handleUnitToggle = () => {
    const newUnit = preferredUnit === 'mg/dL' ? 'mmol/L' : 'mg/dL';
    setPreferredUnit(newUnit);
    updatePreferredUnit(newUnit);
  };

  // Handle notification toggle
  const handleNotificationToggle = (setting: keyof NotificationSettings) => {
    const newSettings = {
      ...notifications,
      [setting]: !notifications[setting]
    };
    setNotifications(newSettings);
    localStorage.setItem('notification_settings', JSON.stringify(newSettings));
  };

  // Get signal quality display
  const getSignalQualityDisplay = (quality?: string) => {
    if (!quality) return null;
    
    const qualityConfig = {
      excellent: { color: 'text-green-600', bg: 'bg-green-50', icon: Wifi },
      good: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Wifi },
      fair: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Wifi },
      poor: { color: 'text-red-600', bg: 'bg-red-50', icon: WifiOff }
    };
    
    const config = qualityConfig[quality as keyof typeof qualityConfig];
    const Icon = config.icon;
    
    return (
      <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs", config.bg, config.color)}>
        <Icon className="w-3 h-3" />
        {quality}
      </div>
    );
  };

  // Get status display
  const getStatusDisplay = (status: string) => {
    const statusConfig = {
      connected: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
      disconnected: { color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle },
      syncing: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    
    return (
      <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", config.bg, config.color)}>
        <Icon className="w-3 h-3" />
        {status}
      </div>
    );
  };

  // Get relative time
  const getRelativeTime = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Handle report export
  const handleExportReport = () => {
    console.log('Exporting comprehensive report...');
    // This would trigger report generation and download
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-6 h-6 text-gray-700" />
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Units Preference */}
        <Card className="bg-white rounded-2xl shadow-sm">
          <CardHeader className="px-6 py-4">
            <CardTitle className="text-base font-semibold text-gray-900">
              Display Units
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Glucose Units</p>
                <p className="text-xs text-gray-600 mt-1">
                  Choose your preferred unit for glucose readings
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-medium",
                  preferredUnit === 'mg/dL' ? 'text-blue-600' : 'text-gray-500'
                )}>
                  mg/dL
                </span>
                <Switch
                  checked={preferredUnit === 'mmol/L'}
                  onCheckedChange={handleUnitToggle}
                  aria-label="Toggle glucose units"
                />
                <span className={cn(
                  "text-sm font-medium",
                  preferredUnit === 'mmol/L' ? 'text-blue-600' : 'text-gray-500'
                )}>
                  mmol/L
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Integrations */}
        <Card className="bg-white rounded-2xl shadow-sm">
          <CardHeader className="px-6 py-4">
            <CardTitle className="text-base font-semibold text-gray-900">
              Device Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            {deviceIntegrations.map((device) => {
              const Icon = device.icon;
              return (
                <div key={device.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <Icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {device.name}
                        </h3>
                        <p className="text-xs text-gray-600">
                          Last sync: {getRelativeTime(device.lastSync)}
                        </p>
                      </div>
                    </div>
                    {getStatusDisplay(device.status)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {device.signalQuality && getSignalQualityDisplay(device.signalQuality)}
                      {device.batteryLevel !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <div className="w-6 h-3 border border-gray-300 rounded-sm relative">
                            <div 
                              className={cn(
                                "h-full rounded-sm",
                                device.batteryLevel > 50 ? 'bg-green-500' : 
                                device.batteryLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'
                              )}
                              style={{ width: `${device.batteryLevel}%` }}
                            />
                          </div>
                          {device.batteryLevel}%
                        </div>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 px-3"
                      disabled={device.status === 'syncing'}
                    >
                      {device.status === 'syncing' ? 'Syncing...' : 
                       device.status === 'connected' ? 'Sync Now' : 'Connect'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-white rounded-2xl shadow-sm">
          <CardHeader className="px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            {[
              { 
                key: 'glucoseAlerts' as const, 
                label: 'Glucose Alerts', 
                description: 'Get notified about significant glucose changes' 
              },
              { 
                key: 'mealReminders' as const, 
                label: 'Meal Reminders', 
                description: 'Gentle reminders to log your meals' 
              },
              { 
                key: 'exerciseReminders' as const, 
                label: 'Activity Reminders', 
                description: 'Encourage regular physical activity' 
              },
              { 
                key: 'weeklyReports' as const, 
                label: 'Weekly Insights', 
                description: 'Summary of your weekly patterns and trends' 
              }
            ].map((setting) => (
              <div key={setting.key} className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{setting.label}</p>
                  <p className="text-xs text-gray-600 mt-1">{setting.description}</p>
                </div>
                <Switch
                  checked={notifications[setting.key]}
                  onCheckedChange={() => handleNotificationToggle(setting.key)}
                  aria-label={`Toggle ${setting.label}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Privacy & Data */}
        <Card className="bg-white rounded-2xl shadow-sm">
          <CardHeader className="px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <Shield className="w-5 h-5" />
              Privacy & Data
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">
                  Data Export
                </h3>
                <Badge variant="outline" className="text-xs">
                  Available
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Export all your health data in a comprehensive report
              </p>
              <Button
                onClick={handleExportReport}
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
            
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Your privacy matters</p>
              <p>All data is stored securely and never shared without your explicit consent. You have full control over your health information.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;