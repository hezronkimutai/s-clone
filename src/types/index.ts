export interface Question {
  id?: string;
  question: string;
  options: string[];
  correct: number;
}

export interface Participant {
  id: string;
  name: string;
  score: number;
  answers: { [questionIndex: number]: number };
  joinedAt: number;
}

export interface QuizSession {
  id: string;
  host: string;
  hostId?: string;
  hostEmail?: string;
  status: 'waiting' | 'active' | 'completed';
  currentQuestion: number;
  currentQuestionData?: Question;
  participants: { [id: string]: Participant };
  questions: Question[];
  questionsArray?: Question[];
  totalQuestions: number;
  createdAt: number;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AppConfig {
  timerDuration: number;
}

export type UserRole = 'host' | 'participant';
export type ToastType = 'success' | 'error' | 'warning' | 'info';
