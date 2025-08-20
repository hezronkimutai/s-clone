import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { getSessionData, updateSessionQuestion, endSession } from '../../services/firebase';
import { defaultQuestions } from '../../data/constants';
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

    // Load session data directly (like backup approach)
    const loadSessionData = async () => {
      try {
        const data = await getSessionData(sessionCode);
        if (data) {
          setSessionData(data);
          setParticipants(Object.values(data.participants || {}));
          
          // Load questions from session if available, otherwise use defaults
          if (data.questions && data.questions.length > 0) {
            dispatch({ type: 'SET_QUESTIONS', payload: data.questions });
          } else if (data.questionsArray && data.questionsArray.length > 0) {
            dispatch({ type: 'SET_QUESTIONS', payload: data.questionsArray });
          } else {
            // Fallback to default questions like in backup
            dispatch({ type: 'SET_QUESTIONS', payload: defaultQuestions });
          }
        }
      } catch (error) {
        console.error('Error loading session:', error);
        (window as any).showToast?.('Session not found', 'error');
        navigate('/');
      }
    };

    loadSessionData();
  }, [sessionCode, navigate, dispatch]);

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

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/join?quiz=${sessionCode}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      (window as any).showToast?.('Quiz link copied to clipboard!', 'success');
    }).catch(() => {
      (window as any).showToast?.('Failed to copy link', 'error');
    });
  };

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
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading session...</p>
          <p className="session-code">Session Code: {sessionCode}</p>
          <div className="loading-actions">
            <button className="btn secondary" onClick={() => navigate('/')}>
              ← Back to Home
            </button>
            <button className="btn tertiary" onClick={() => window.location.reload()}>
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = state.questions[currentQuestionIndex];
  const shareUrl = `${window.location.origin}/join?quiz=${sessionCode}`;

  return (
    <div className="host-dashboard">
      <div className="container">
        <div className="quiz-header">
          <h2>Quiz Session</h2>
          <div className="quiz-info">
            <span>Code: <strong>{sessionCode}</strong></span>
            <span>Participants: <span>{participants.length}</span></span>
          </div>
        </div>

        <div className="share-link">
          <h4>Share this quiz with participants:</h4>
          <div className="share-url">{shareUrl}</div>
          <button className="copy-link-btn btn secondary" onClick={handleCopyLink}>
            📋 Copy Link
          </button>
        </div>

        {!isQuestionActive ? (
          <div className="section waiting-room">
            <h3>Waiting for participants...</h3>
            <div className="participants-list">
              {participants.length === 0 ? (
                <p>No participants yet. Share the link above!</p>
              ) : (
                participants.map((participant: any, index: number) => (
                  <div key={index} className="participant-item">
                    <span>{participant.name}</span>
                    <span>Score: {participant.score || 0}</span>
                  </div>
                ))
              )}
            </div>
            <button className="btn primary" onClick={startQuestion} disabled={participants.length === 0}>
              Start Quiz
            </button>
          </div>
        ) : (
          <div className="section question-display">
            <div className="question-header">
              <span>Question {currentQuestionIndex + 1} of {state.questions.length}</span>
              <div className="timer">
                <span>{timeLeft}</span>s
              </div>
            </div>
            {currentQuestion && (
              <>
                <h3>{currentQuestion.question}</h3>
                <div className="answer-options">
                  {currentQuestion.options.map((option: string, index: number) => (
                    <div key={index} className="answer-option">
                      {String.fromCharCode(65 + index)}. {option}
                    </div>
                  ))}
                </div>
                <button className="btn primary" onClick={nextQuestion}>
                  Next Question
                </button>
              </>
            )}
          </div>
        )}

        <button className="btn danger" onClick={endQuizSession}>
          End Session
        </button>
      </div>
    </div>
  );
};

export default HostDashboard;
