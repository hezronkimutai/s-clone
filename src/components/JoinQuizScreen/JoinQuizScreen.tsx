import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { joinSession } from '../../services/firebase';
import './JoinQuizScreen.css';

const JoinQuizScreen: React.FC = () => {
  const { dispatch } = useAppContext();
  const navigate = useNavigate();
  const [sessionCode, setSessionCode] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionCode.trim() || !participantName.trim()) {
      (window as any).showToast?.('Please enter both session code and your name', 'warning', 'Missing Information');
      return;
    }

    setIsLoading(true);

    try {
      const participantId = await joinSession(sessionCode.toUpperCase(), participantName.trim());
      
      dispatch({ type: 'SET_CURRENT_SESSION', payload: sessionCode.toUpperCase() });
      dispatch({ type: 'SET_USER_ROLE', payload: 'participant' });
      
      (window as any).showToast?.('Successfully joined quiz session!', 'success', 'Welcome!');
      
      // Navigate to participant view
      navigate(`/participant/${sessionCode.toUpperCase()}`, { 
        state: { participantId, participantName: participantName.trim() } 
      });
      
    } catch (error: any) {
      console.error('Error joining session:', error);
      (window as any).showToast?.('Failed to join quiz: ' + error.message, 'error', 'Join Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="screen join-quiz-screen active">
      <div className="container">
        <div className="join-quiz-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
          <h1>Join Quiz</h1>
          <p>Enter the session code to join an active quiz</p>
        </div>

        <div className="join-quiz-content">
          <div className="join-form-card">
            <form onSubmit={handleJoinQuiz}>
              <div className="form-group">
                <label htmlFor="session-code">Session Code</label>
                <input
                  type="text"
                  id="session-code"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                  disabled={isLoading}
                  className="session-code-input"
                />
                <small>The 6-digit code provided by the quiz host</small>
              </div>

              <div className="form-group">
                <label htmlFor="participant-name">Your Name</label>
                <input
                  type="text"
                  id="participant-name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  disabled={isLoading}
                />
                <small>This will be displayed on the leaderboard</small>
              </div>

              <button 
                type="submit" 
                className="btn primary large join-btn"
                disabled={isLoading || sessionCode.length !== 6}
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Joining Quiz...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🔗</span>
                    Join Quiz Session
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="join-info">
            <h3>How to join:</h3>
            <ol>
              <li>📱 Get the 6-digit session code from the quiz host</li>
              <li>✏️ Enter your name (visible to other participants)</li>
              <li>🎯 Click "Join Quiz Session" to start</li>
              <li>⏳ Wait for the host to start the quiz</li>
            </ol>
          </div>

          <div className="tips-card">
            <h3>Tips for the best experience:</h3>
            <ul>
              <li>🔊 Make sure you have a stable internet connection</li>
              <li>📱 Keep your device charged for the entire session</li>
              <li>🤝 Choose a name that others will recognize</li>
              <li>⚡ Be ready to answer quickly - each question is timed!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinQuizScreen;
