import { ref, set, get, push, remove } from 'firebase/database';
import { database } from '../config/firebase';
import { Question, QuizSession, Participant } from '../types';

export const generateSessionCode = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createSession = async (
    hostName: string, 
    sessionCode: string, 
    questions: Question[], 
    hostId?: string, 
    hostEmail?: string
): Promise<void> => {
    if (!questions || questions.length === 0) {
        throw new Error('No questions available to create session');
    }
    
    const sessionData: Omit<QuizSession, 'id'> = {
        host: hostName,
        status: 'waiting',
        currentQuestion: -1,
        participants: {},
        questions: questions,
        questionsArray: questions,
        totalQuestions: questions.length,
        createdAt: Date.now()
    };
    
    if (hostId) {
        (sessionData as any).hostId = hostId;
        (sessionData as any).hostEmail = hostEmail;
    }
    
    await set(ref(database, 'sessions/' + sessionCode), sessionData);
};

export const joinSession = async (sessionCode: string, participantName: string): Promise<string> => {
    const participantId = push(ref(database, 'sessions/' + sessionCode + '/participants')).key!;
    
    const participantData: Participant = {
        id: participantId,
        name: participantName,
        score: 0,
        answers: {},
        joinedAt: Date.now()
    };
    
    await set(ref(database, 'sessions/' + sessionCode + '/participants/' + participantId), participantData);
    return participantId;
};

export const loadQuestionsFromFirebase = async (): Promise<Question[]> => {
    const snapshot = await get(ref(database, 'questions'));
    if (snapshot.exists()) {
        const questionsData = snapshot.val();
        return Object.keys(questionsData).map(id => ({
            id,
            ...questionsData[id]
        }));
    }
    return [];
};

export const saveQuestionToFirebase = async (questionData: Omit<Question, 'id'>): Promise<void> => {
    await push(ref(database, 'questions'), questionData);
};

export const deleteQuestionFromFirebase = async (questionId: string): Promise<void> => {
    await remove(ref(database, 'questions/' + questionId));
};

export const loadDefaultQuestionsToFirebase = async (defaultQuestions: Question[]): Promise<void> => {
    const promises = defaultQuestions.map(question => 
        push(ref(database, 'questions'), question)
    );
    await Promise.all(promises);
};

export const saveQuestionsToFirebase = async (questions: Question[]): Promise<void> => {
    // Clear existing questions first
    await remove(ref(database, 'questions'));
    
    // Add all questions
    const promises = questions.map(question => 
        push(ref(database, 'questions'), question)
    );
    await Promise.all(promises);
};

export const listenToSession = (sessionCode: string, callback: (data: any) => void) => {
    // This will be implemented with Firebase onValue listener
    // For now, return a placeholder unsubscribe function
    return () => {};
};

export const updateSessionQuestion = async (sessionCode: string, questionIndex: number, isActive: boolean): Promise<void> => {
    const updates = {
        currentQuestion: questionIndex,
        questionActive: isActive
    };
    await set(ref(database, `sessions/${sessionCode}`), updates);
};

export const endSession = async (sessionCode: string): Promise<void> => {
    await set(ref(database, `sessions/${sessionCode}/status`), 'completed');
};
