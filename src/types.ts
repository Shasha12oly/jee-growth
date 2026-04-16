import { Timestamp } from 'firebase/firestore';

export interface StudySession {
  userId: string;
  date: Timestamp;
  physics: number;
  chemistry: number;
  math: number;
  totalHours: number;
  dailyGoal: number;
  createdAt: Timestamp;
}

export interface PomodoroSession {
  userId: string;
  task: string;
  duration: number;
  completedAt: Timestamp;
  startTime: Timestamp;
}

export interface UserProfile {
  uid: string;
  email: string;
  dailyGoal: number;
  totalStudyHours: number;
  currentStreak: number;
  createdAt: Timestamp;
  lastStudyDate?: Timestamp;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}
