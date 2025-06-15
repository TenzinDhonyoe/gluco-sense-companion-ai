
import { type LogEntry as OriginalLogEntry } from "@/pages/Logs";

export interface LogEntry extends Omit<OriginalLogEntry, 'time' | 'type'> {
  time: string; // Use ISO string for localStorage compatibility
  type: 'meal' | 'exercise' | 'snack' | 'beverage';
}

const LOGS_STORAGE_KEY = 'userLogs';

const getDefaultLogs = (): LogEntry[] => [
  {
    id: '1',
    type: 'meal',
    description: 'Grilled chicken salad with quinoa',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    points: 15
  },
  {
    id: '2',
    type: 'exercise',
    description: '20-minute brisk walk',
    time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    points: 25
  },
  {
    id: '3',
    type: 'snack',
    description: 'Greek yogurt with berries',
    time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    points: 10
  }
];

export const getLogs = (): LogEntry[] => {
  try {
    const logsJson = localStorage.getItem(LOGS_STORAGE_KEY);
    if (logsJson) {
      return JSON.parse(logsJson);
    }
  } catch (error) {
    console.error("Failed to parse logs from localStorage", error);
  }
  return getDefaultLogs();
};

export const addLog = (logData: Omit<LogEntry, 'id' | 'time' | 'points'> & { points: number }) => {
  const currentLogs = getLogs();
  const newLog: LogEntry = {
    ...logData,
    id: Date.now().toString(),
    time: new Date().toISOString(),
  };

  const updatedLogs = [newLog, ...currentLogs];
  localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updatedLogs));
  window.dispatchEvent(new CustomEvent('logsChanged'));
};
