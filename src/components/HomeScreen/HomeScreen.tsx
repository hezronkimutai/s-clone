import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, signOut as firebaseSignOut, onAuthStateChange, signInWithEmail, createAccountWithEmail } from '../../services/auth';
import { User as FirebaseUser } from 'firebase/auth';
import './HomeScreen.css';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [activeTab, setActiveTab] = useState('my-quizzes');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setIsSignedIn(true);
        setCurrentUser(user);
        setUserPhoto(user.photoURL);
        (window as any).showToast?.(`Welcome back, ${user.displayName || user.email}!`, 'success');
      } else {
        setIsSignedIn(false);
        setCurrentUser(null);
        setUserPhoto(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      (window as any).showToast?.('Google sign-in successful!', 'success');
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      (window as any).showToast?.(`Sign-in failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = () => {
    setShowEmailForm(true);
    setIsSignUp(false);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      (window as any).showToast?.('Please fill in all fields', 'error');
      return;
    }

    setEmailLoading(true);
    try {
      if (isSignUp) {
        await createAccountWithEmail(email, password);
        (window as any).showToast?.('Account created successfully!', 'success');
      } else {
        await signInWithEmail(email, password);
        (window as any).showToast?.('Signed in successfully!', 'success');
      }
      setShowEmailForm(false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      console.error('Email authentication error:', error);
      (window as any).showToast?.(`Authentication failed: ${error.message}`, 'error');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut();
      (window as any).showToast?.('Signed out successfully', 'success');
    } catch (error: any) {
      console.error('Sign-out error:', error);
      (window as any).showToast?.(`Sign-out failed: ${error.message}`, 'error');
    }
  };

  return (
    <div id="home-screen" className="screen active">
      <div className="container">
        <h1>Quiz Master</h1>

        {/* Authentication Section */}
        <div id="auth-section" className="auth-section">
          <div id="signed-out-view" className={`auth-view ${isSignedIn ? 'hidden' : ''}`}>
            <div className="auth-card">
              <h3>Sign In to Save Your Quizzes</h3>
              <p>Create an account to save and manage your quiz sessions</p>
              <div className="auth-buttons">
                <button 
                  id="google-signin-btn" 
                  className="btn auth-btn google"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <span>{isLoading ? '⏳' : '🔍'}</span> 
                  {isLoading ? 'Signing in...' : 'Sign in with Google'}
                </button>
                <button 
                  id="email-signin-btn" 
                  className="btn auth-btn email"
                  onClick={handleEmailSignIn}
                >
                  <span>📧</span> Sign in with Email
                </button>
              </div>

              {/* Email Sign-in Form */}
              {showEmailForm && (
                <div className="email-form-overlay">
                  <div className="email-form">
                    <div className="form-header">
                      <h4>{isSignUp ? 'Create Account' : 'Sign In'}</h4>
                      <button 
                        className="close-btn" 
                        onClick={() => setShowEmailForm(false)}
                      >
                        ✕
                      </button>
                    </div>
                    <form onSubmit={handleEmailSubmit}>
                      <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={emailLoading}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                          type="password"
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={emailLoading}
                        />
                      </div>
                      <div className="form-actions">
                        <button 
                          type="submit" 
                          className="btn primary"
                          disabled={emailLoading}
                        >
                          {emailLoading ? '⏳ ' : ''}{isSignUp ? 'Create Account' : 'Sign In'}
                        </button>
                        <button 
                          type="button" 
                          className="btn tertiary"
                          onClick={() => setIsSignUp(!isSignUp)}
                          disabled={emailLoading}
                        >
                          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div id="signed-in-view" className={`auth-view ${!isSignedIn ? 'hidden' : ''}`}>
            <div className="user-info">
              <div className="user-avatar">
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="User" />
                ) : (
                  <div className="user-initials">
                    {currentUser?.displayName?.charAt(0)?.toUpperCase() || 
                     currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="user-details">
                <span className="user-name">
                  {currentUser?.displayName || 'User'}
                </span>
                <span className="user-email">
                  {currentUser?.email || ''}
                </span>
              </div>
              <button 
                className="btn secondary small"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="home-options">
          <button 
            id="create-quiz-btn" 
            className="btn primary"
            onClick={() => navigate('/create')}
          >
            Create Quiz
          </button>

          {/* Quiz Tabs Section */}
          <div className="quiz-tabs-section">
            {/* Tab Navigation */}
            <div className="tab-navigation">
              <button 
                id="my-quizzes-tab" 
                className={`tab-btn ${activeTab === 'my-quizzes' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-quizzes')}
              >
                My Quizzes
              </button>
              <button 
                id="available-quizzes-tab" 
                className={`tab-btn ${activeTab === 'available-quizzes' ? 'active' : ''}`}
                onClick={() => setActiveTab('available-quizzes')}
              >
                Available Quizzes
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {/* My Quizzes Tab */}
              <div 
                id="my-quizzes-content" 
                className={`tab-panel ${activeTab === 'my-quizzes' ? 'active' : ''}`}
              >
                <div id="my-quizzes-list" className="quiz-list">
                  <div className="loading-message">Loading your quizzes...</div>
                </div>
                <button id="refresh-my-quizzes-btn" className="btn secondary">🔄 Refresh My Quizzes</button>
              </div>

              {/* Available Quizzes Tab */}
              <div 
                id="available-quizzes-content" 
                className={`tab-panel ${activeTab === 'available-quizzes' ? 'active' : ''}`}
              >
                <div id="available-quizzes" className="quiz-list">
                  <div className="loading-message">Loading available quizzes...</div>
                </div>
                <button id="refresh-quizzes-btn" className="btn secondary">🔄 Refresh</button>
              </div>
            </div>
          </div>
          
          <div className="memory-bank-access">
            <a href="memory-bank/index.html" className="btn tertiary">🧠 Memory Bank</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
