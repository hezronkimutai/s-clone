import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { database } from '../../config/firebase';
import { ref, onValue, off, get, update } from 'firebase/database';
import './ParticipantView.css';

interface LocationState {
  participantId: string;
  participantName: string;
}

interface Question {
  question: string;
  options: string[];
  correct: number;
}

interface SessionData {
  status: string;
  currentQuestion: number;
  currentQuestionData?: Question;
  questions?: Question[];
}

const ParticipantView: React.FC = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  
  const [currentView, setCurrentView] = useState<'waiting' | 'question' | 'results'>('waiting');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionNum, setQuestionNum] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [rank, setRank] = useState('-');
  const [sessionListener, setSessionListener] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!state?.participantId || !state?.participantName || !sessionCode) {
      navigate('/join');
      return;
    }

    // Set up session listener
    const sessionRef = ref(database, `sessions/${sessionCode}`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const sessionData = snapshot.val() as SessionData;
      if (sessionData) {
        console.log('Session update:', sessionData.status, 'Current question:', sessionData.currentQuestion);
        
        // Update questions if available
        if (sessionData.questions) {
          setQuestions(sessionData.questions);
          setTotalQuestions(sessionData.questions.length);
        }

        if (sessionData.status === 'active' && sessionData.currentQuestion >= 0) {
          console.log('Showing question for index:', sessionData.currentQuestion);
          setCurrentView('question');
          showQuestion(sessionData.currentQuestion, sessionData.currentQuestionData, sessionData.questions);
        } else if (sessionData.status === 'completed') {
          setCurrentView('results');
          loadResults();
        } else {
          console.log('Session not active yet, status:', sessionData.status);
          setCurrentView('waiting');
        }
      }
    });

    setSessionListener(unsubscribe);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state, navigate, sessionCode]);

  const showQuestion = (questionIndex: number, questionData?: Question, sessionQuestions?: Question[]) => {
    // Stop any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Reset answer selection for new question
    setSelectedAnswer(null);
    setQuestionNum(questionIndex + 1);

    // Use the question data provided by host, or fallback to session questions
    let question = questionData;
    if (!question && sessionQuestions && sessionQuestions[questionIndex]) {
      question = sessionQuestions[questionIndex];
    }
    if (!question && questions[questionIndex]) {
      question = questions[questionIndex];
    }

    if (!question) {
      console.error('No question available at index:', questionIndex);
      (window as any).showToast?.('Loading questions...', 'info');
      return;
    }

    setCurrentQuestion(question);

    // Start timer
    startTimer(20);
  };

  const startTimer = (duration: number) => {
    setTimeLeft(duration);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          
          // Time's up
          if (selectedAnswer === null) {
            (window as any).showToast?.("Time's up!", 'warning');
          }
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswerSelect = async (optionIndex: number) => {
    if (selectedAnswer !== null) return; // Already answered
    
    setSelectedAnswer(optionIndex);
    
    // Submit answer to Firebase
    try {
      const isCorrect = currentQuestion && optionIndex === currentQuestion.correct;
      const currentScore = isCorrect ? 1 : 0;
      
      const updates: any = {};
      updates[`sessions/${sessionCode}/participants/${state.participantId}/answers/${questionNum - 1}`] = {
        answer: optionIndex,
        isCorrect,
        score: currentScore,
        submittedAt: Date.now()
      };
      
      // Update total score
      updates[`sessions/${sessionCode}/participants/${state.participantId}/score`] = score + currentScore;
      
      await update(ref(database), updates);
      setScore(score + currentScore);
      
      (window as any).showToast?.('Answer submitted!', 'success');
      
    } catch (error) {
      console.error('Error submitting answer:', error);
      (window as any).showToast?.('Error submitting answer', 'error');
    }
  };

  const loadResults = async () => {
    try {
      // Get participant's final score
      const participantRef = ref(database, `sessions/${sessionCode}/participants/${state.participantId}`);
      const participantSnapshot = await get(participantRef);
      const participantData = participantSnapshot.val();
      
      if (participantData) {
        setScore(participantData.score || 0);
      }

      // Get all participants for leaderboard
      const participantsRef = ref(database, `sessions/${sessionCode}/participants`);
      const participantsSnapshot = await get(participantsRef);
      const participants = participantsSnapshot.val() || {};
      
      const leaderboardData = Object.entries(participants)
        .map(([id, participant]: [string, any]) => ({ id, ...participant }))
        .sort((a, b) => b.score - a.score);
      
      setLeaderboard(leaderboardData);
      
      // Find current user's rank
      const userRank = leaderboardData.findIndex(p => p.id === state.participantId) + 1;
      setRank(userRank.toString());
      
    } catch (error) {
      console.error('Error loading results:', error);
      (window as any).showToast?.('Error loading results', 'error');
    }
  };

  if (!state) {
    return null;
  }

  return (
    <div className="participant-view">
      <div className="container">
        <div className="participant-header">
          <h2>Quiz Session</h2>
          <span>Welcome, <span>{state.participantName}</span>!</span>
        </div>

        {currentView === 'waiting' && (
          <div className="section participant-waiting">
            <h3>Waiting for quiz to start...</h3>
            <p>Quiz Code: <strong>{sessionCode}</strong></p>
          </div>
        )}

        {currentView === 'question' && currentQuestion && (
          <div className="section participant-question">
            <div className="question-header">
              <span>Question {questionNum} of {totalQuestions}</span>
              <div className="timer">
                <span>{timeLeft}</span>s
              </div>
            </div>
            <h3>{currentQuestion.question}</h3>
            <div className="participant-options">
              {currentQuestion.options.map((option: string, index: number) => (
                <button
                  key={index}
                  className={`option-btn ${selectedAnswer === index ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null}
                >
                  {String.fromCharCode(65 + index)}. {option}
                </button>
              ))}
            </div>
            {selectedAnswer !== null && (
              <div className="participant-feedback">
                <p>Answer submitted!</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'results' && (
          <div className="section participant-results">
            <h3>Quiz Complete!</h3>
            <div className="score-display">
              <p>Your Score: <span>{score}</span>/<span>{totalQuestions}</span></p>
              <p>Your Rank: <span>#{rank}</span></p>
            </div>
            <div className="participant-leaderboard">
              <h4>Final Rankings:</h4>
              {leaderboard.map((participant, index) => (
                <div 
                  key={participant.id} 
                  className={`leaderboard-item rank-${index + 1} ${participant.id === state.participantId ? 'current-user' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className="rank-badge">{index + 1}</span>
                    <span><strong>{participant.name}</strong></span>
                  </div>
                  <span><strong>{participant.score || 0}/{totalQuestions}</strong></span>
                </div>
              ))}
            </div>
            <button className="btn primary" onClick={() => navigate('/')}>
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantView;
