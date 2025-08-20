import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { createSession, generateSessionCode, loadQuestionsFromFirebase, loadDefaultQuestionsToFirebase } from '../../services/firebase';
import { defaultQuestions } from '../../data/constants';
import './CreateQuizScreen.css';

const CreateQuizScreen: React.FC = () => {
  const { state, dispatch, config } = useAppContext();
  const navigate = useNavigate();
  const [hostName, setHostName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load questions if not already loaded (like backup approach)
    if (state.questions.length === 0) {
      const loadQuestions = async () => {
        try {
          let questions = await loadQuestionsFromFirebase();
          
          // If no questions exist in Firebase, load and save defaults
          if (questions.length === 0) {
            console.log('No questions found in Firebase, loading default questions...');
            questions = defaultQuestions; // Use defaults immediately
            try {
              await loadDefaultQuestionsToFirebase(defaultQuestions);
              (window as any).showToast?.('Default questions loaded successfully!', 'success');
            } catch (firebaseError) {
              console.warn('Could not save defaults to Firebase, using local:', firebaseError);
              (window as any).showToast?.('Using local questions (Firebase unavailable)', 'warning');
            }
          }
          
          dispatch({ type: 'SET_QUESTIONS', payload: questions });
        } catch (error) {
          console.error('Error loading questions:', error);
          // Always fallback to local default questions like backup
          dispatch({ type: 'SET_QUESTIONS', payload: defaultQuestions });
          (window as any).showToast?.('Using local questions (Firebase unavailable)', 'warning');
        }
      };
      
      loadQuestions();
    }
  }, [state.questions.length, dispatch]);

  const handleLoadDefaultQuestions = async () => {
    setIsLoading(true);
    try {
      // Use defaults immediately (like backup)
      dispatch({ type: 'SET_QUESTIONS', payload: defaultQuestions });
      (window as any).showToast?.('Default questions loaded!', 'success');
      
      // Try to save to Firebase in background
      try {
        await loadDefaultQuestionsToFirebase(defaultQuestions);
      } catch (firebaseError) {
        console.warn('Could not save to Firebase:', firebaseError);
      }
    } catch (error) {
      console.error('Error loading default questions:', error);
      (window as any).showToast?.('Error loading questions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hostName.trim()) {
      (window as any).showToast?.('Please enter your name to create a quiz', 'warning', 'Name Required');
      return;
    }

    if (state.questions.length === 0) {
      (window as any).showToast?.('No questions available! Please add questions first.', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const sessionCode = generateSessionCode();
      await createSession(
        hostName.trim(), 
        sessionCode, 
        state.questions,
        state.user?.uid,
        state.user?.email || undefined
      );

      dispatch({ type: 'SET_CURRENT_SESSION', payload: sessionCode });
      dispatch({ type: 'SET_USER_ROLE', payload: 'host' });
      
      (window as any).showToast?.(`Quiz created successfully! Share code: ${sessionCode}`, 'success', 'Quiz Ready');
      
      // Navigate to host dashboard
      navigate(`/host/${sessionCode}`);
      
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      (window as any).showToast?.('Failed to create quiz session: ' + error.message, 'error', 'Creation Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="screen create-quiz-screen active">
      <div className="container">
        <div className="create-quiz-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
          <h1>Create New Quiz</h1>
          <p>Set up a new quiz session for your participants</p>
        </div>

        <div className="create-quiz-content">
          <div className="quiz-setup-card">
            <div className="setup-section">
              <h2>Quiz Setup</h2>
              
              <form onSubmit={handleCreateQuiz}>
                <div className="form-group">
                  <label htmlFor="host-name">Your Name (Host)</label>
                  <input
                    type="text"
                    id="host-name"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="quiz-info">
                  <div className="info-item">
                    <span className="info-label">Questions Available:</span>
                    <span className="info-value">{state.questions.length}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Timer per Question:</span>
                    <span className="info-value">{config.timerDuration} seconds</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Authentication:</span>
                    <span className="info-value">
                      {state.user ? `Signed in as ${state.user.displayName || state.user.email}` : 'Guest mode'}
                    </span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn primary large create-btn"
                  disabled={isLoading || state.questions.length === 0}
                >
                  {isLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Creating Quiz...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">🎯</span>
                      Create Quiz Session
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {state.questions.length === 0 && (
            <div className="warning-card">
              <div className="warning-icon">⚠️</div>
              <div className="warning-content">
                <h3>No Questions Available</h3>
                <p>You need to add questions before creating a quiz session.</p>
                <div className="warning-actions">
                  <button 
                    className="btn primary"
                    onClick={handleLoadDefaultQuestions}
                    disabled={isLoading}
                  >
                    {isLoading ? '⏳ Loading...' : '📝 Load Default Questions'}
                  </button>
                  <button 
                    className="btn secondary"
                    onClick={() => navigate('/questions')}
                  >
                    Manage Questions
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="feature-list">
            <h3>What happens next?</h3>
            <ul>
              <li>🔗 You'll get a unique 6-digit session code</li>
              <li>📤 Share the code with participants to join</li>
              <li>⏱️ Control the quiz timing and progression</li>
              <li>📊 View real-time results and leaderboard</li>
              <li>💾 Save results (when signed in)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuizScreen;
