import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeScreen.css';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="home-screen">
      <div className="container">
        <h1>Quiz Master</h1>
        <p>Welcome to Quiz Master - Your Interactive Quiz Platform</p>
        <div className="main-actions">
          <button 
            className="btn primary large"
            onClick={() => navigate('/create')}
          >
            Create New Quiz
          </button>
          <button 
            className="btn secondary large"
            onClick={() => navigate('/join')}
          >
            Join Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
