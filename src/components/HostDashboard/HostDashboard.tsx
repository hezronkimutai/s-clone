import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { listenToSession, updateSessionQuestion, endSession } from '../../services/firebase';
import './HostDashboard.css';

const HostDashboard: React.FC = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionData, setSessionData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (!sessionCode) {
      navigate('/');
      return;
    }

    // Listen to session updates
    const unsubscribe = listenToSession(sessionCode, (data) => {
      if (data) {
        setSessionData(data);
        setParticipants(Object.values(data.participants || {}));
      } else {
        (window as any).showToast?.('Session not found', 'error');
        navigate('/');
      }
    });

    return () => unsubscribe?.();
  }, [sessionCode, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isQuestionActive && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleQuestionTimeout();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, isQuestionActive]);

  const startQuestion = async () => {
    if (currentQuestionIndex >= state.questions.length) {
      (window as any).showToast?.('No more questions available', 'info');
      return;
    }

    try {
      await updateSessionQuestion(sessionCode!, currentQuestionIndex, true);
      setIsQuestionActive(true);
      setTimeLeft(20);
      (window as any).showToast?.('Question started!', 'success');
    } catch (error) {
      console.error('Error starting question:', error);
      (window as any).showToast?.('Failed to start question', 'error');
    }
  };

  const handleQuestionTimeout = async () => {
    try {
      await updateSessionQuestion(sessionCode!, currentQuestionIndex, false);
      setIsQuestionActive(false);
      (window as any).showToast?.('Time\'s up!', 'info');
    } catch (error) {
      console.error('Error ending question:', error);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < state.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(20);
    } else {
      (window as any).showToast?.('Quiz completed!', 'success');
    }
  };

  const endQuizSession = async () => {
    if (window.confirm('Are you sure you want to end this quiz session?')) {
      try {
        await endSession(sessionCode!);
        (window as any).showToast?.('Quiz session ended', 'success');
        navigate('/');
      } catch (error) {
        console.error('Error ending session:', error);
        (window as any).showToast?.('Failed to end session', 'error');
      }
    }
  };

  if (!sessionData) {
    return (
      <div className="host-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading session...</p>
      </div>
    );
  }

  const currentQuestion = state.questions[currentQuestionIndex];

  return (
    <div className="host-dashboard">
      <div className="dashboard-header">
        <div className="session-info">
          <h1>Quiz Session: {sessionCode}</h1>
          <p>Host: {sessionData.hostName}</p>
        </div>
        <button className="btn danger" onClick={endQuizSession}>
          End Session
        </button>
      </div>

      <div className="dashboard-content">
        <div className="question-control">
          <div className="question-header">
            <h2>Question {currentQuestionIndex + 1} of {state.questions.length}</h2>
            {isQuestionActive && (
              <div className="timer">
                <span className="timer-value">{timeLeft}s</span>
              </div>
            )}
          </div>

          {currentQuestion && (
            <div className="current-question">
              <h3>{currentQuestion.question}</h3>
              <div className="options">
                {currentQuestion.options.map((option: string, index: number) => (
                  <div key={index} className={`option ${index === currentQuestion.correct ? 'correct' : ''}`}>
                    {option}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="question-controls">
            <button 
              className="btn primary"
              onClick={startQuestion}
              disabled={isQuestionActive || currentQuestionIndex >= state.questions.length}
            >
              {isQuestionActive ? 'Question Active' : 'Start Question'}
            </button>
            <button 
              className="btn secondary"
              onClick={nextQuestion}
              disabled={isQuestionActive || currentQuestionIndex >= state.questions.length - 1}
            >
              Next Question
            </button>
          </div>
        </div>

        <div className="participants-panel">
          <h3>Participants ({participants.length})</h3>
          <div className="participants-list">
            {participants.map((participant, index) => (
              <div key={index} className="participant-item">
                <span className="participant-name">{participant.name}</span>
                <span className="participant-score">{participant.score || 0} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;
