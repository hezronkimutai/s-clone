import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import HomeScreen from './components/HomeScreen/HomeScreen';
import CreateQuizScreen from './components/CreateQuizScreen/CreateQuizScreen';
import JoinQuizScreen from './components/JoinQuizScreen/JoinQuizScreen';
import ToastContainer from './components/ToastContainer/ToastContainer';
import './App.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/create" element={<CreateQuizScreen />} />
            <Route path="/join" element={<JoinQuizScreen />} />
            {/* Add more routes here as we create more components */}
          </Routes>
          <ToastContainer />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
