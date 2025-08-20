import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Question, QuizSession, User, UserRole, AppConfig } from '../types';
import { appConfig } from '../data/constants';

interface AppState {
  user: User | null;
  currentSession: string | null;
  currentQuestionIndex: number;
  questions: Question[];
  userRole: UserRole | null;
  timer: number;
  sessionData: QuizSession | null;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_CURRENT_SESSION'; payload: string | null }
  | { type: 'SET_CURRENT_QUESTION_INDEX'; payload: number }
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'SET_USER_ROLE'; payload: UserRole | null }
  | { type: 'SET_TIMER'; payload: number }
  | { type: 'SET_SESSION_DATA'; payload: QuizSession | null }
  | { type: 'RESET_STATE' };

const initialState: AppState = {
  user: null,
  currentSession: null,
  currentQuestionIndex: -1,
  questions: [],
  userRole: null,
  timer: appConfig.timerDuration,
  sessionData: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload };
    case 'SET_CURRENT_QUESTION_INDEX':
      return { ...state, currentQuestionIndex: action.payload };
    case 'SET_QUESTIONS':
      return { ...state, questions: action.payload };
    case 'SET_USER_ROLE':
      return { ...state, userRole: action.payload };
    case 'SET_TIMER':
      return { ...state, timer: action.payload };
    case 'SET_SESSION_DATA':
      return { ...state, sessionData: action.payload };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  config: AppConfig;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch, config: appConfig }}>
      {children}
    </AppContext.Provider>
  );
};
