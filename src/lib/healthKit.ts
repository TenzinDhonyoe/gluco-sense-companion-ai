import { Capacitor } from '@capacitor/core';

// Define types for HealthKit data
export interface HealthKitData {
  steps: number;
  sleep: number; // in hours
  hasPermissions: boolean;
  error?: string;
}

export interface StepData {
  value: number;
  date: string;
}

export interface SleepData {
  value: number; // in minutes
  date: string;
}

class HealthKitService {
  private healthPlugin: any = null;

  constructor() {
    if (Capacitor.isNativePlatform()) {
      this.initializePlugin();
    }
  }

  private async initializePlugin() {
    try {
      // Import the plugin dynamically for iOS
      const { Health } = await import('capacitor-health');
      this.healthPlugin = Health;
    } catch (error) {
      console.error('Failed to initialize HealthKit plugin:', error);
    }
  }

  /**
   * Request permissions for reading health data
   */
  async requestPermissions(): Promise<boolean> {
    if (!this.healthPlugin || !Capacitor.isNativePlatform()) {
      console.log('HealthKit not available - using on web or plugin not loaded');
      return false;
    }

    try {
      const permissions = {
        read: [
          'steps',
          'sleep'
        ]
      };

      const result = await this.healthPlugin.requestPermissions(permissions);
      console.log('HealthKit permissions result:', result);
      
      return result.granted || false;
    } catch (error) {
      console.error('Error requesting HealthKit permissions:', error);
      return false;
    }
  }

  /**
   * Get today's step count
   */
  async getTodaySteps(): Promise<number> {
    if (!this.healthPlugin || !Capacitor.isNativePlatform()) {
      return this.getMockSteps();
    }

    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const query = {
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
        dataType: 'steps'
      };

      const result = await this.healthPlugin.queryHKitSampleType(query);
      console.log('Steps query result:', result);

      if (result.resultData && result.resultData.length > 0) {
        // Sum up all step data for today
        const totalSteps = result.resultData.reduce((sum: number, item: any) => {
          return sum + (item.value || 0);
        }, 0);
        
        return Math.round(totalSteps);
      }

      return 0;
    } catch (error) {
      console.error('Error fetching steps from HealthKit:', error);
      return this.getMockSteps();
    }
  }

  /**
   * Get today's sleep duration in hours
   */
  async getTodaySleep(): Promise<number> {
    if (!this.healthPlugin || !Capacitor.isNativePlatform()) {
      return this.getMockSleep();
    }

    try {
      const today = new Date();
      // Sleep data typically spans from previous evening to current morning
      // So we look at sleep from yesterday evening to this morning
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(18, 0, 0, 0); // Start from 6 PM yesterday
      
      const endTime = new Date(today);
      endTime.setHours(12, 0, 0, 0); // End at noon today

      const query = {
        startDate: yesterday.toISOString(),
        endDate: endTime.toISOString(),
        dataType: 'sleep'
      };

      const result = await this.healthPlugin.queryHKitSampleType(query);
      console.log('Sleep query result:', result);

      if (result.resultData && result.resultData.length > 0) {
        // Calculate total sleep duration
        let totalSleepMinutes = 0;
        
        result.resultData.forEach((sleepSession: any) => {
          if (sleepSession.startDate && sleepSession.endDate) {
            const start = new Date(sleepSession.startDate);
            const end = new Date(sleepSession.endDate);
            const durationMs = end.getTime() - start.getTime();
            const durationMinutes = durationMs / (1000 * 60);
            totalSleepMinutes += durationMinutes;
          }
        });

        const totalHours = totalSleepMinutes / 60;
        return Math.round(totalHours * 10) / 10; // Round to 1 decimal place
      }

      return 0;
    } catch (error) {
      console.error('Error fetching sleep from HealthKit:', error);
      return this.getMockSleep();
    }
  }

  /**
   * Get comprehensive health data for today
   */
  async getTodayHealthData(): Promise<HealthKitData> {
    const hasPermissions = await this.requestPermissions();
    
    try {
      const [steps, sleep] = await Promise.all([
        this.getTodaySteps(),
        this.getTodaySleep()
      ]);

      return {
        steps,
        sleep,
        hasPermissions
      };
    } catch (error) {
      console.error('Error fetching health data:', error);
      return {
        steps: this.getMockSteps(),
        sleep: this.getMockSleep(),
        hasPermissions: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Calculate step goal progress (assuming 10,000 steps goal)
   */
  getStepProgress(steps: number, goal: number = 10000): number {
    return Math.min(Math.round((steps / goal) * 100), 100);
  }

  /**
   * Calculate sleep goal progress (assuming 8 hours goal)
   */
  getSleepProgress(sleepHours: number, goal: number = 8): number {
    return Math.min(Math.round((sleepHours / goal) * 100), 100);
  }

  /**
   * Mock data for development/web testing
   */
  private getMockSteps(): number {
    // Generate realistic step count based on time of day
    const hour = new Date().getHours();
    const baseSteps = Math.floor(Math.random() * 2000) + 6000; // 6000-8000 base
    const timeMultiplier = Math.min(hour / 20, 1); // Increase throughout day
    return Math.round(baseSteps * timeMultiplier);
  }

  private getMockSleep(): number {
    // Generate realistic sleep hours
    return Math.round((Math.random() * 2 + 6.5) * 10) / 10; // 6.5-8.5 hours
  }

  /**
   * Check if HealthKit is available
   */
  isAvailable(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
  }
}

// Export singleton instance
export const healthKitService = new HealthKitService();
export default healthKitService;